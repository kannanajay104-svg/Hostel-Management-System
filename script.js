// ==================== DATABASE (LocalStorage with Demo Data) ====================
let complaintsDB = [];
let usersDB = [
    { id: "u1", email: "student@hcms.com", password: "student123", role: "student", name: "Alex Johnson", block: "A", floor: "2", room: "A-204", avatar: "👨‍🎓" },
    { id: "u2", email: "warden@hcms.com", password: "warden123", role: "warden", name: "David Miller", block: "A", avatar: "👨‍✈️" },
    { id: "u3", email: "manager@hcms.com", password: "manager123", role: "manager", name: "Sarah Lee", avatar: "👩‍💼" },
    { id: "u4", email: "vp@hcms.com", password: "vp123", role: "vp", name: "Robert Vice", avatar: "👨‍🎓" },
    { id: "u5", email: "principal@hcms.com", password: "principal123", role: "principal", name: "Elizabeth Dean", avatar: "👩‍🏫" }
];

let currentUser = null;
let currentView = "login";

// Load/Save Data
function loadData() {
    const stored = localStorage.getItem("hcms_complaints_v2");
    if (stored) {
        complaintsDB = JSON.parse(stored);
    } else {
        const now = Date.now();
        complaintsDB = [
            { id: "CMP-1001", studentId: "u1", studentName: "Alex Johnson", block: "A", floor: "2", room: "A-204", title: "Water Leakage in Washroom", description: "Severe pipe burst causing flooding in bathroom area. Need urgent plumbing service.", imageProof: "💧", expectedHours: 24, createdAt: now - 48 * 3600000, status: "Pending", assignedTo: "warden", escalationLevel: 0, deadline: now - 24 * 3600000, resolvedAt: null },
            { id: "CMP-1002", studentId: "u1", studentName: "Alex Johnson", block: "A", floor: "2", room: "A-204", title: "Ceiling Fan Not Working", description: "Fan makes grinding noise and doesn't rotate properly. Request replacement.", imageProof: "🌀", expectedHours: 12, createdAt: now - 10 * 3600000, status: "In Progress", assignedTo: "warden", escalationLevel: 0, deadline: now + 2 * 3600000, resolvedAt: null },
            { id: "CMP-1003", studentId: "u1", studentName: "Alex Johnson", block: "A", floor: "2", room: "A-204", title: "Broken Window Glass", description: "Window glass cracked with sharp edges. Safety hazard for students.", imageProof: "🪟", expectedHours: 48, createdAt: now - 72 * 3600000, status: "Pending", assignedTo: "manager", escalationLevel: 1, deadline: now - 24 * 3600000, resolvedAt: null },
            { id: "CMP-1004", studentId: "u2", studentName: "John Smith", block: "B", floor: "1", room: "B-105", title: "No Hot Water", description: "Geyser not working since 3 days", imageProof: "💧", expectedHours: 24, createdAt: now - 30 * 3600000, status: "Pending", assignedTo: "warden", escalationLevel: 0, deadline: now - 6 * 3600000, resolvedAt: null }
        ];
        saveComplaints();
    }
}

function saveComplaints() {
    localStorage.setItem("hcms_complaints_v2", JSON.stringify(complaintsDB));
}

// Escalation Engine
function runEscalation() {
    let updated = false;
    const now = Date.now();
    for (let comp of complaintsDB) {
        if (comp.status === "Solved") continue;
        if (now > comp.deadline) {
            if (comp.escalationLevel === 0 && comp.assignedTo === "warden") {
                comp.escalationLevel = 1;
                comp.assignedTo = "manager";
                comp.status = "Pending";
                updated = true;
            } else if (comp.escalationLevel === 1 && comp.assignedTo === "manager") {
                comp.escalationLevel = 2;
                comp.assignedTo = "vp";
                comp.status = "Pending";
                updated = true;
            } else if (comp.escalationLevel === 2 && comp.assignedTo === "vp") {
                comp.escalationLevel = 3;
                comp.assignedTo = "principal";
                comp.status = "Pending";
                updated = true;
            }
        }
    }
    if (updated) saveComplaints();
}

// Submit Complaint
function submitComplaint(data) {
    const now = Date.now();
    const newComplaint = {
        id: "CMP-" + Math.floor(Math.random() * 9000 + 1000),
        studentId: currentUser.id,
        studentName: currentUser.name,
        block: data.block,
        floor: data.floor,
        room: data.room,
        title: data.title,
        description: data.description,
        imageProof: data.imageProof || "📎",
        expectedHours: data.expectedHours,
        createdAt: now,
        status: "Pending",
        assignedTo: "warden",
        escalationLevel: 0,
        deadline: now + (data.expectedHours * 3600000),
        resolvedAt: null
    };
    complaintsDB.push(newComplaint);
    saveComplaints();
    return newComplaint;
}

// Get Filtered Complaints by Role
function getFilteredComplaints() {
    if (!currentUser) return [];
    if (currentUser.role === "student") {
        return complaintsDB.filter(c => c.studentId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
    }
    if (currentUser.role === "warden") {
        return complaintsDB.filter(c => c.block === currentUser.block && (c.escalationLevel === 0 || c.assignedTo === "warden"));
    }
    if (currentUser.role === "manager") {
        return complaintsDB.filter(c => c.escalationLevel === 1 || c.assignedTo === "manager");
    }
    if (currentUser.role === "vp") {
        return complaintsDB.filter(c => c.escalationLevel === 2 || c.assignedTo === "vp");
    }
    if (currentUser.role === "principal") {
        return complaintsDB.filter(c => c.escalationLevel === 3 || c.assignedTo === "principal");
    }
    return [];
}

// Update Status
function updateStatus(complaintId, newStatus) {
    const comp = complaintsDB.find(c => c.id === complaintId);
    if (!comp) return false;
    
    if (currentUser.role === "student") return false;
    if (currentUser.role === "warden" && comp.escalationLevel !== 0) return false;
    if (currentUser.role === "manager" && comp.escalationLevel !== 1) return false;
    if (currentUser.role === "vp" && comp.escalationLevel !== 2) return false;
    if (currentUser.role === "principal" && comp.escalationLevel !== 3) return false;
    
    comp.status = newStatus;
    if (newStatus === "Solved") comp.resolvedAt = Date.now();
    saveComplaints();
    return true;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== RENDER FUNCTIONS ====================
function render() {
    const app = document.getElementById("app");
    if (currentView === "login") renderLogin(app);
    else if (currentView === "dashboard") renderDashboard(app);
    else if (currentView === "newComplaint") renderComplaintForm(app);
}

function renderLogin(container) {
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 relative" style="min-height: 100vh;">
            <div class="glass-card max-w-md w-full p-6 md:p-8 fade-in">
                <div class="text-center mb-6 md:mb-8">
                    <div class="logo-icon inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl mb-4">
                        <i class="fas fa-building text-white text-2xl md:text-3xl"></i>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Hostel<span class="text-gradient">Connect</span></h1>
                    <p class="text-gray-300 text-xs md:text-sm">Smart Complaint Management System</p>
                </div>
                
                <form id="loginForm" class="space-y-4">
                    <div class="relative">
                        <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="email" id="loginEmail" placeholder="Email Address" class="input-modern pl-11" required>
                    </div>
                    <div class="relative">
                        <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="password" id="loginPassword" placeholder="Password" class="input-modern pl-11" required>
                    </div>
                    <button type="submit" class="btn-primary">Sign In <i class="fas fa-arrow-right ml-2"></i></button>
                </form>
                
                <div class="mt-6 pt-4 border-t border-white/10">
                    <p class="text-xs text-gray-400 text-center mb-3">Demo Credentials</p>
                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>🎓 student@hcms.com</div>
                        <div>👮 warden@hcms.com</div>
                        <div>💼 manager@hcms.com</div>
                        <div>👑 vp@hcms.com</div>
                        <div>🏫 principal@hcms.com</div>
                        <div class="text-indigo-400">Password: role123</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const user = usersDB.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = { ...user };
            runEscalation();
            currentView = "dashboard";
            render();
        } else {
            alert("❌ Invalid credentials. Use student@hcms.com / student123");
        }
    });
}

function renderDashboard(container) {
    runEscalation();
    const complaints = getFilteredComplaints();
    const roleTitles = {
        student: "Student Dashboard", warden: "Warden Dashboard", 
        manager: "Manager Dashboard", vp: "Vice Principal Dashboard", 
        principal: "Principal Dashboard"
    };
    const roleIcons = { student: "user-graduate", warden: "user-shield", manager: "chart-line", vp: "crown", principal: "landmark" };
    
    let complaintsHtml = complaints.map((comp, idx) => {
        const isOverdue = Date.now() > comp.deadline && comp.status !== "Solved";
        let statusClass = comp.status === "Pending" ? "badge-pending" : (comp.status === "In Progress" ? "badge-progress" : "badge-solved");
        let statusIcon = comp.status === "Pending" ? "⏳" : (comp.status === "In Progress" ? "⚙️" : "✅");
        
        return `
            <div class="glass-card complaint-card p-4 md:p-5 fade-in" style="animation-delay: ${idx * 0.05}s">
                <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-lg">${comp.id}</span>
                        ${comp.escalationLevel > 0 ? `<span class="badge-escalated"><i class="fas fa-exclamation-triangle"></i> Lv${comp.escalationLevel}</span>` : ''}
                    </div>
                    <span class="badge ${statusClass}"><span>${statusIcon}</span> ${comp.status}</span>
                </div>
                
                <h3 class="text-base md:text-lg font-bold text-white mb-2">${escapeHtml(comp.title)}</h3>
                <p class="text-gray-300 text-xs md:text-sm mb-3">${escapeHtml(comp.description.substring(0, 80))}${comp.description.length > 80 ? '...' : ''}</p>
                
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div><i class="fas fa-building"></i> ${comp.block} | F${comp.floor} | R${comp.room}</div>
                    <div><i class="far fa-clock"></i> ${comp.expectedHours}h</div>
                    <div class="col-span-2"><i class="far fa-calendar"></i> ${new Date(comp.deadline).toLocaleString()}</div>
                    ${isOverdue ? `<div class="col-span-2 text-orange-400 text-xs"><i class="fas fa-exclamation-triangle"></i> OVERDUE</div>` : ''}
                </div>
                
                ${currentUser.role !== "student" && comp.status !== "Solved" ? `
                    <div class="flex gap-2 mt-3">
                        <button onclick="handleStatusChange('${comp.id}', 'In Progress')" class="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-xl text-xs md:text-sm transition cursor-pointer">
                            <i class="fas fa-play-circle"></i> Progress
                        </button>
                        <button onclick="handleStatusChange('${comp.id}', 'Solved')" class="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-2 rounded-xl text-xs md:text-sm transition cursor-pointer">
                            <i class="fas fa-check-circle"></i> Resolve
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    if (complaints.length === 0) {
        complaintsHtml = `<div class="glass-card p-8 text-center col-span-full">
            <i class="fas fa-inbox text-4xl md:text-5xl text-gray-500 mb-3"></i>
            <p class="text-gray-400 text-sm">No complaints found</p>
        </div>`;
    }
    
    container.innerHTML = `
        <div class="min-h-screen p-4 md:p-6 pb-20 md:pb-6">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 fade-in">
                    <div class="flex items-center gap-3 md:gap-4">
                        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <i class="fas fa-${roleIcons[currentUser.role]} text-white text-xl md:text-2xl"></i>
                        </div>
                        <div>
                            <h1 class="text-xl md:text-3xl font-bold text-white">${roleTitles[currentUser.role]}</h1>
                            <p class="text-gray-300 text-xs md:text-sm">Welcome back, ${currentUser.name} ${currentUser.role === 'warden' ? `(Block ${currentUser.block})` : ''}</p>
                        </div>
                    </div>
                    <div class="flex gap-3 w-full md:w-auto">
                        ${currentUser.role === "student" ? `<button id="newComplaintBtn" class="btn-primary flex-1 md:flex-none"><i class="fas fa-plus mr-2"></i>New Complaint</button>` : ''}
                        <button id="logoutBtn" class="btn-secondary flex-1 md:flex-none"><i class="fas fa-sign-out-alt mr-2"></i>Logout</button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 fade-in delay-100">
                    <div class="glass-card p-3 md:p-4 text-center">
                        <i class="fas fa-ticket-alt text-indigo-400 text-xl md:text-2xl mb-1 md:mb-2"></i>
                        <p class="text-xl md:text-2xl font-bold text-white">${complaints.length}</p>
                        <p class="text-xs text-gray-400">Total</p>
                    </div>
                    <div class="glass-card p-3 md:p-4 text-center">
                        <i class="fas fa-hourglass-half text-yellow-400 text-xl md:text-2xl mb-1 md:mb-2"></i>
                        <p class="text-xl md:text-2xl font-bold text-white">${complaints.filter(c => c.status === "Pending").length}</p>
                        <p class="text-xs text-gray-400">Pending</p>
                    </div>
                    <div class="glass-card p-3 md:p-4 text-center">
                        <i class="fas fa-chart-line text-blue-400 text-xl md:text-2xl mb-1 md:mb-2"></i>
                        <p class="text-xl md:text-2xl font-bold text-white">${complaints.filter(c => c.status === "In Progress").length}</p>
                        <p class="text-xs text-gray-400">Progress</p>
                    </div>
                    <div class="glass-card p-3 md:p-4 text-center">
                        <i class="fas fa-check-circle text-green-400 text-xl md:text-2xl mb-1 md:mb-2"></i>
                        <p class="text-xl md:text-2xl font-bold text-white">${complaints.filter(c => c.status === "Solved").length}</p>
                        <p class="text-xs text-gray-400">Resolved</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    ${complaintsHtml}
                </div>
            </div>
        </div>
        
        <!-- Mobile Bottom Navigation -->
        <div class="bottom-nav">
            <div class="nav-item active" data-nav="dashboard">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </div>
            ${currentUser.role === "student" ? `
            <div class="nav-item" data-nav="new">
                <i class="fas fa-plus-circle"></i>
                <span>New</span>
            </div>
            ` : ''}
            <div class="nav-item" data-nav="logout">
                <i class="fas fa-sign-out-alt"></i>
                <span>Exit</span>
            </div>
        </div>
    `;
    
    document.getElementById("newComplaintBtn")?.addEventListener("click", () => { currentView = "newComplaint"; render(); });
    document.getElementById("logoutBtn")?.addEventListener("click", () => { currentUser = null; currentView = "login"; render(); });
    
    // Mobile bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = item.getAttribute('data-nav');
            if (action === 'dashboard') {
                currentView = "dashboard";
                render();
            } else if (action === 'new' && currentUser.role === "student") {
                currentView = "newComplaint";
                render();
            } else if (action === 'logout') {
                currentUser = null;
                currentView = "login";
                render();
            }
        });
    });
}

window.handleStatusChange = (id, status) => {
    if (updateStatus(id, status)) {
        runEscalation();
        render();
    } else {
        alert("❌ Action not permitted for your role!");
    }
};

function renderComplaintForm(container) {
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 pb-20 md:pb-4">
            <div class="glass-card max-w-2xl w-full p-6 md:p-8 fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl md:text-2xl font-bold text-white"><i class="fas fa-pen-alt text-indigo-400 mr-2"></i>Submit Complaint</h2>
                    <button id="backBtn" class="text-gray-400 hover:text-white text-2xl transition cursor-pointer">&times;</button>
                </div>
                
                <form id="complaintForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <input type="text" id="block" placeholder="Block (A/B/C)" class="input-modern" required>
                        <input type="text" id="floor" placeholder="Floor" class="input-modern" required>
                        <input type="text" id="room" placeholder="Room No." class="input-modern" required>
                    </div>
                    <input type="text" id="title" placeholder="Issue Title" class="input-modern" required>
                    <textarea id="desc" rows="4" placeholder="Detailed description of the problem..." class="input-modern" required></textarea>
                    <input type="number" id="hours" placeholder="Expected resolution (hours)" min="1" max="168" value="24" class="input-modern" required>
                    
                    <div class="flex flex-col md:flex-row gap-3 pt-4">
                        <button type="button" id="cancelBtn" class="btn-secondary flex-1 cursor-pointer">Cancel</button>
                        <button type="submit" class="btn-primary flex-1 cursor-pointer"><i class="fas fa-paper-plane mr-2"></i>Submit</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Mobile Bottom Navigation -->
        <div class="bottom-nav">
            <div class="nav-item" data-nav="back">
                <i class="fas fa-arrow-left"></i>
                <span>Back</span>
            </div>
        </div>
    `;
    
    document.getElementById("backBtn")?.addEventListener("click", () => { currentView = "dashboard"; render(); });
    document.getElementById("cancelBtn")?.addEventListener("click", () => { currentView = "dashboard"; render(); });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            currentView = "dashboard";
            render();
        });
    });
    
    document.getElementById("complaintForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const complaint = {
            block: document.getElementById("block").value.trim().toUpperCase(),
            floor: document.getElementById("floor").value.trim(),
            room: document.getElementById("room").value.trim().toUpperCase(),
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("desc").value.trim(),
            expectedHours: parseInt(document.getElementById("hours").value),
            imageProof: "📎"
        };
        
        if (!complaint.block || !complaint.floor || !complaint.room || !complaint.title || !complaint.description) {
            alert("⚠️ Please fill all fields");
            return;
        }
        
        const newComp = submitComplaint(complaint);
        alert(`✅ Complaint ${newComp.id} submitted!\n📅 Deadline: ${new Date(newComp.deadline).toLocaleString()}`);
        currentView = "dashboard";
        render();
    });
}

// Initialize App
loadData();
runEscalation();
render();