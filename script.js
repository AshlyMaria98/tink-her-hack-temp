// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const terminalContainer = document.getElementById('terminalContainer');
const terminalOutput = document.getElementById('terminalOutput');
const resultContainer = document.getElementById('resultContainer');
const markdownOutput = document.getElementById('markdownOutput');

// Placeholder for your Gemini API Key
const GEMINI_API_KEY = 'AIzaSyBU1r9QeuTFYzRmiHR_n4Q5a60nek8Rqkw'; 

// Terminal simulation logs
const loadingSteps = [
    "[SYSTEM] Initiating sequence...",
    "[SYSTEM] Analyzing project requirements...",
    "[SYSTEM] Evaluating scalability constraints...",
    "[SYSTEM] Designing monolithic vs microservices approach...",
    "[SYSTEM] Selecting optimal tech stack components...",
    "[SYSTEM] Structuring database schema relationships...",
    "[SYSTEM] Defining core RESTful API endpoints...",
    "[SYSTEM] Drafting deployment and CI/CD strategy...",
    "[SYSTEM] Finalizing architecture blueprint..."
];

generateBtn.addEventListener('click', async () => {
    const desc = document.getElementById('projectDesc').value;
    const scale = document.getElementById('expectedScale').value;

    if (!desc.trim()) {
        alert("Please enter a project description.");
        return;
    }

    
// 1. Hide and COMPLETELY CLEAR previous results
    resultContainer.classList.add('hidden');
    markdownOutput.innerHTML = ''; // Wipe old text
    
    const learningHub = document.getElementById('learningHubContainer');
    if(learningHub) learningHub.classList.add('hidden'); // Hide old videos
    
    const mermaidContainer = document.getElementById('mermaidContainer');
    if(mermaidContainer) {
        mermaidContainer.classList.add('hidden'); // Hide old diagram
        mermaidContainer.innerHTML = ''; // Wipe old diagram drawing
    }
    const costContainer = document.getElementById('costEstimatorContainer');
    if(costContainer) costContainer.classList.add('hidden'); // Hide old cost estimator
    // 2. Show terminal and start loading
    terminalContainer.classList.remove('hidden');
    terminalOutput.innerHTML = '';
    generateBtn.disabled = true;
    generateBtn.textContent = 'Architecting...';

    // Simulate terminal logging
    await simulateTerminalLogs();

    // Call the AI
    await fetchArchitecture(desc, scale);
});

// Function to simulate terminal loading steps
function simulateTerminalLogs() {
    return new Promise((resolve) => {
        let step = 0;
        const interval = setInterval(() => {
            if (step < loadingSteps.length) {
                const p = document.createElement('p');
                p.className = 'log-line';
                p.textContent = loadingSteps[step];
                terminalOutput.appendChild(p);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
                step++;
            } else {
                clearInterval(interval);
                setTimeout(resolve, 500); // small pause after logs finish
            }
        }, 600); // Wait 600ms between each log
    });
}

// Function to call the AI API
// Function to call the AI API
async function fetchArchitecture(description, scale) {
    
    // 1. The Prompt structure (WITH GUARDRAIL & STRICT MERMAID RULES)
    const prompt = `
    Act as a Master System Architect. I have a project idea and need a full system architecture plan.
    Project Description: ${description}
    Expected Scale: ${scale}

    CRITICAL GUARDRAIL INSTRUCTION: First, evaluate if the "Project Description" is a valid software application, website, or technical system idea. 
    If the description is a random, non-technical, or out-of-context phrase (e.g., "dog eating ice cream", a recipe, a joke, or general chatting), you MUST reply ONLY with this exact secret code: ERROR_OUT_OF_CONTEXT
    Do not explain yourself, do not apologize, and do not generate any headers. Just output that exact code.
    
    If it IS a valid software project, ignore the secret code and provide the plan formatted strictly in Markdown with the following headers:

    ### Executive Summary
    (Provide a brief, 2-3 sentence overview summarizing the core architectural approach).

    ### Architecture Diagram
    (Provide a valid Mermaid.js graph TD code block illustrating the system architecture. Enclose it strictly in \`\`\`mermaid and \`\`\` tags. DO NOT use parentheses (), square brackets [], or curly braces {} inside node names).

    ### 1. Architecture Style
    ### 2. Recommended Tech Stack
    ### 3. Database Schema
    ### 4. Core API Endpoints
    ### 5. Scalability Strategy
    ### 6. Deployment Strategy
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        // --- 1. GUARDRAIL CHECK LOGIC ---
        if (aiText.includes('ERROR_OUT_OF_CONTEXT')) {
            terminalContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
            // Hide extra feature boxes
            if(document.getElementById('mermaidContainer')) document.getElementById('mermaidContainer').classList.add('hidden');
            if(document.getElementById('learningHubContainer')) document.getElementById('learningHubContainer').classList.add('hidden');
            if(document.getElementById('costEstimatorContainer')) document.getElementById('costEstimatorContainer').classList.add('hidden');
            
            // Show the apology box
            markdownOutput.innerHTML = `
                <div style="text-align: center; padding: 3rem; background-color: rgba(255, 95, 86, 0.1); border: 1px dashed #ff5f56; border-radius: 8px;">
                    <h2 style="color: #ff5f56; margin-bottom: 1rem;">⚠️ Out of Context</h2>
                    <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.6;">
                        Sorry, that is out of what I can do. I only generate system architectures for software, apps, and technical domains. Please enter a valid tech project idea.
                    </p>
                </div>
            `;
            return; // Force the function to stop here!
        }

        // --- 2. MERMAID EXTRACTION LOGIC ---
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
        const match = aiText.match(mermaidRegex);
        
        let cleanText = aiText;
        const mermaidContainer = document.getElementById('mermaidContainer');
        
        if (match) {
            const mermaidCode = match[1]; 
            cleanText = aiText.replace(mermaidRegex, ''); 
            
            mermaidContainer.classList.remove('hidden');
            // This forces Mermaid to use standard SVG text so the PDF library can see it!
mermaid.initialize({ 
                startOnLoad: false, 
                theme: 'dark', 
                flowchart: { htmlLabels: false } 
            });
            
         try {
                // Render the graphic
                const { svg } = await mermaid.render('archGraph_' + Date.now(), mermaidCode);
                mermaidContainer.innerHTML = svg;
                
                // THE PDF SCALING FIX: Force html2canvas to respect the width
                const svgElement = mermaidContainer.querySelector('svg');
                if (svgElement) {
                    // Force the intrinsic width to 100% instead of a fixed massive pixel number
                    svgElement.setAttribute('width', '100%');
                    svgElement.removeAttribute('height'); // Prevent stretching
                }
            } catch (err) {
                console.error("Mermaid error:", err);
                mermaidContainer.innerHTML = "<p style='color: var(--text-muted);'>Diagram could not be rendered.</p>";
            }
        } else {
            mermaidContainer.classList.add('hidden');
            mermaidContainer.innerHTML = "";
        }
        
        // --- 3. UPDATE THE UI ---
        terminalContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        markdownOutput.innerHTML = marked.parse(cleanText);
        
        // --- 4. TRIGGER YOUR EXTRA FEATURES ---
        generateLearningResources(cleanText);
        calculateCostEstimator(cleanText);

    } catch (error) {
        // --- 5. THE UPGRADED ERROR CATCHER ---
        console.error("Error generating architecture:", error);
        
        resultContainer.classList.add('hidden');
        terminalContainer.classList.remove('hidden');
        
        terminalOutput.innerHTML += `<p class="log-line" style="color: #ff5f56; font-weight: bold;">[ERROR] System Failure: ${error.message}</p>`;
        terminalOutput.innerHTML += `<p class="log-line" style="color: #ffbd2e;">[TIP] If it says "HTTP error! status: 429", you are clicking too fast. Wait 1 minute and try again.</p>`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Architecture';
    }
}
// --- 1. SIDEBAR TAB LOGIC ---
const menuItems = document.querySelectorAll('#sidebarMenu li');
const tabContents = document.querySelectorAll('.tab-content');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all menu items
        menuItems.forEach(i => i.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');

        // Hide all tabs
        tabContents.forEach(tab => tab.classList.remove('active', 'hidden'));
        tabContents.forEach(tab => tab.classList.add('hidden'));

        // Show the target tab
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
        document.getElementById(targetId).classList.add('active');
    });
});
// --- 2. PDF DOWNLOAD LOGIC ---
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
        const element = document.getElementById('pdfExportArea');
        
        const originalText = downloadPdfBtn.textContent;
        downloadPdfBtn.textContent = "Packaging PDF...";
        downloadPdfBtn.disabled = true;
        
        window.scrollTo(0, 0);

        // --- THE DEFINITIVE SVG PIXEL-LOCK FIX ---
        const svgNode = document.querySelector('#mermaidContainer svg');
        let oldWidth = '';
        let oldHeight = '';

        if (svgNode) {
            // 1. Save the original responsive styles
            oldWidth = svgNode.style.width || svgNode.getAttribute('width');
            oldHeight = svgNode.style.height || svgNode.getAttribute('height');

            // 2. html2canvas goes completely blind if an SVG width is "100%". 
            // We must measure it and lock it to exact physical pixels for 1 second!
            const rect = svgNode.getBoundingClientRect();
            svgNode.setAttribute('width', rect.width + 'px');
            svgNode.setAttribute('height', rect.height + 'px');
            svgNode.style.width = rect.width + 'px';
            svgNode.style.height = rect.height + 'px';
        }

        const opt = {
            margin:       10,
            filename:     'Idea2infra_Architecture_Plan.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#0f172a',
                scrollY: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] } 
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error("PDF Generation Error:", err);
        } finally {
            // 3. Put the original responsive styles back so the website doesn't break!
            if (svgNode) {
                svgNode.setAttribute('width', oldWidth || '100%');
                svgNode.setAttribute('height', oldHeight || 'auto');
                svgNode.style.width = oldWidth || '100%';
                svgNode.style.height = oldHeight || 'auto';
            }
            downloadPdfBtn.textContent = originalText;
            downloadPdfBtn.disabled = false;
        }
    });
}
// --- 3. DYNAMIC LEARNING HUB LOGIC ---
const resourceDictionary = {
    "HTML": "https://www.youtube.com/results?search_query=HTML+crash+course+for+beginners",
    "CSS": "https://www.youtube.com/results?search_query=CSS+crash+course",
    "JavaScript": "https://www.youtube.com/results?search_query=Vanilla+JavaScript+tutorial",
    "React": "https://www.youtube.com/results?search_query=React+js+crash+course+for+beginners",
    "Node.js": "https://www.youtube.com/results?search_query=Node.js+express+backend+tutorial",
    "Python": "https://www.youtube.com/results?search_query=Python+backend+api+tutorial",
    "Firebase": "https://www.youtube.com/results?search_query=Firebase+web+setup+tutorial",
    "PostgreSQL": "https://www.youtube.com/results?search_query=PostgreSQL+tutorial+for+beginners",
    "MongoDB": "https://www.youtube.com/results?search_query=MongoDB+crash+course",
    "AWS": "https://www.youtube.com/results?search_query=AWS+architecture+for+beginners",
    "Flutter": "https://www.youtube.com/results?search_query=Flutter+app+development+tutorial",
    "Docker": "https://www.youtube.com/results?search_query=Docker+in+100+seconds"
};

function generateLearningResources(aiText) {
    const learningHubContainer = document.getElementById('learningHubContainer');
    const learningLinks = document.getElementById('learningLinks');
    
    // Clear previous links
    learningLinks.innerHTML = '';
    let foundResources = false;

    // Check the AI text for our keywords
    for (const [tech, link] of Object.entries(resourceDictionary)) {
        // If the AI text mentions the technology, create a button for it!
        if (aiText.toLowerCase().includes(tech.toLowerCase())) {
            foundResources = true;
            const a = document.createElement('a');
            a.href = link;
            a.target = "_blank"; // Opens in a new tab
            a.className = "resource-chip";
            a.innerHTML = `▶️ Learn ${tech}`;
            learningLinks.appendChild(a);
        }
    }

    // Show the container only if we found matching resources
    if (foundResources) {
        learningHubContainer.classList.remove('hidden');
    } else {
        learningHubContainer.classList.add('hidden');
    }
}
// --- 4. INTERACTIVE COST ESTIMATOR LOGIC ---
const costEstimatorContainer = document.getElementById('costEstimatorContainer');
const userSlider = document.getElementById('userSlider');
const userCountDisplay = document.getElementById('userCountDisplay');
const totalCostDisplay = document.getElementById('totalCostDisplay');
const costDisclaimer = document.getElementById('costDisclaimer');

let currentCostPerUser = 0.00; // Default base rate
let currentBaseFee = 0;

function calculateCostEstimator(aiText) {
    // 1. Determine the "Tier" based on AI keywords
    const textLower = aiText.toLowerCase();
    
    if (textLower.includes('aws') || textLower.includes('microservices') || textLower.includes('kubernetes')) {
        // Enterprise Tier (Expensive)
        currentCostPerUser = 0.05; 
        currentBaseFee = 150; // Minimum cost for load balancers, RDS, etc.
        costDisclaimer.textContent = "*Base rate: Enterprise Cloud (AWS/GCP) + Managed DBs";
    } 
    else if (textLower.includes('firebase') || textLower.includes('supabase') || textLower.includes('baas')) {
        // Startup Tier (BaaS)
        currentCostPerUser = 0.01;
        currentBaseFee = 25; // Small fixed cost for pro plans
        costDisclaimer.textContent = "*Base rate: Managed BaaS (Firebase/Supabase)";
    } 
    else {
        // Static/MVP Tier (Very Cheap)
        currentCostPerUser = 0.001;
        currentBaseFee = 5; // Basically just domain and basic CDN
        costDisclaimer.textContent = "*Base rate: Static Hosting (Vercel/Netlify) + Serverless";
    }

    // 2. Unhide the widget
    costEstimatorContainer.classList.remove('hidden');
    
    // 3. Trigger the math calculation immediately to show the initial value
    updateCostDisplay();
}

// Math function to update the DOM
function updateCostDisplay() {
    const users = parseInt(userSlider.value);
    userCountDisplay.textContent = users.toLocaleString(); // Adds the commas (e.g., 10,000)
    
    const totalCost = currentBaseFee + (users * currentCostPerUser);
    totalCostDisplay.textContent = "$" + totalCost.toFixed(2);
}

// Add the event listener so the slider updates the math in real-time
userSlider.addEventListener('input', updateCostDisplay);
// --- 5. BOILERPLATE EXPORTER LOGIC (MIC-DROP FEATURE) ---
const downloadCodeBtn = document.getElementById('downloadCodeBtn');

if (downloadCodeBtn) {
    downloadCodeBtn.addEventListener('click', async () => {
        // Change button text to show it's working
        const originalText = downloadCodeBtn.textContent;
        downloadCodeBtn.textContent = "Packaging Project...";
        downloadCodeBtn.disabled = true;

        try {
            // Initialize a new zip file
            const zip = new JSZip();

            // 1. Create the Frontend Folder
            const frontend = zip.folder("frontend");
            frontend.folder("src"); 
            frontend.folder("public"); 
            
            // Create a standard index.html inside frontend
            frontend.file("index.html", `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>idea2infra UI</title>\n</head>\n<body>\n    <h1>Welcome to your new Frontend</h1>\n</body>\n</html>`);
            frontend.file("package.json", `{\n  "name": "frontend-app",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "echo 'Starting frontend...'"\n  }\n}`);

            // 2. Create the Backend Folder
            const backend = zip.folder("backend");
            backend.folder("controllers");
            backend.folder("models");
            backend.folder("routes");
            backend.folder("config"); 

            // Create a standard Node.js server file
            backend.file("server.js", `const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n    res.send('idea2infra Backend API is running!');\n});\n\napp.listen(PORT, () => {\n    console.log(\`Server is running on port \${PORT}\`);\n});`);

            // Create a basic package.json for the backend
            backend.file("package.json", `{\n  "name": "idea2infra-backend",\n  "version": "1.0.0",\n  "main": "server.js",\n  "dependencies": {\n    "express": "^4.18.2",\n    "cors": "^2.8.5",\n    "dotenv": "^16.0.3"\n  }\n}`);

            // 3. Create a master README file in the root directory
            zip.file("README.md", `# System Architecture Starter Code\nThis boilerplate workspace was automatically generated by idea2infra.\n\n## Next Steps\n1. Open the \`frontend\` folder to build your UI.\n2. Open the \`backend\` folder, run \`npm install\`, and start building your APIs!`);

            // 4. Generate the zip file and trigger the download
            const content = await zip.generateAsync({ type: "blob" });
            
            // Create a temporary hidden link to download the blob
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = "idea2infra_Starter_Workspace.zip";
            downloadLink.click();
            
            // Clean up memory
            URL.revokeObjectURL(downloadLink.href);

        } catch (error) {
            console.error("Error generating zip:", error);
            alert("Failed to generate the starter code.");
        } finally {
            // Reset the button
            downloadCodeBtn.textContent = originalText;
            downloadCodeBtn.disabled = false;
        }
    });
}