let selectedCoords = null;
let lastDeletedLog = null;

const map = L.map('map').setView([13.0827, 80.2707], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = null;
map.on('click', e => {
    selectedCoords = e.latlng;
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
});

document.getElementById('wasteForm').addEventListener('submit', e => {
    e.preventDefault();

    if (!selectedCoords) {
        alert('Please select a location on the map.');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const logs = getLogs();
        logs.push({
            image: reader.result,
            description: desc.value,
            lat: selectedCoords.lat,
            lng: selectedCoords.lng,
            time: new Date().toLocaleString()
        });
        saveLogs(logs);
        e.target.reset();
        if (marker) map.removeLayer(marker);
        selectedCoords = null;
        renderLogs();
    };
    reader.readAsDataURL(photo.files[0]);
});

function getLogs() {
    return JSON.parse(localStorage.getItem('wasteLogs') || '[]');
}
function saveLogs(logs) {
    localStorage.setItem('wasteLogs', JSON.stringify(logs));
}
function toggleLogs() {
    logContainer.style.display =
        logContainer.style.display === 'none' ? 'block' : 'none';
}

function renderLogs() {
    const logs = getLogs();
    logContainer.innerHTML = `<h2>Waste Logs</h2>`;

    if (lastDeletedLog) {
        const undoBtn = document.createElement('button');
        undoBtn.textContent = 'Undo Last Delete';
        undoBtn.style.marginBottom = '10px';
        undoBtn.onclick = undoDelete;
        logContainer.appendChild(undoBtn);
    }

    logs.forEach((log, index) => {
        const div = document.createElement('div');
        div.className = 'log';
        div.innerHTML = `
            <strong>${log.time}</strong><br>
            <em>Location:</em> (${log.lat.toFixed(4)}, ${log.lng.toFixed(4)})<br>
            <em>Description:</em> ${log.description}<br>
            <img src="${log.image}">
            <br>
            <button onclick="deleteLog(${index})" style="background:#c0392b;margin-top:8px">
              Delete
            </button>
        `;
        logContainer.appendChild(div);
    });
}

function deleteLog(index) {
    const logs = getLogs();
    lastDeletedLog = logs[index];
    logs.splice(index, 1);
    saveLogs(logs);
    renderLogs();
}

function undoDelete() {
    if (!lastDeletedLog) return;
    const logs = getLogs();
    logs.push(lastDeletedLog);
    saveLogs(logs);
    lastDeletedLog = null;
    renderLogs();
}

function clearLogs() {
    if (!confirm('Clear all logs?')) return;
    saveLogs([]);
    lastDeletedLog = null;
    renderLogs();
}

function exportCSV() {
    const logs = getLogs();
    if (!logs.length) return alert('No logs to export');

    const rows = logs.map(l =>
        `"${l.time}","${l.description}",${l.lat},${l.lng}`
    );

    const csv = 'Time,Description,Latitude,Longitude\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'waste_logs.csv';
    a.click();
}

document.getElementById('csvImport').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const lines = reader.result.split('\n').slice(1);
        const logs = getLogs();

        lines.forEach(line => {
            const [time, desc, lat, lng] = line.split(',');
            if (!time) return;
            logs.push({
                time: time.replace(/"/g, ''),
                description: desc.replace(/"/g, ''),
                lat: Number(lat),
                lng: Number(lng),
                image: ''
            });
        });

        saveLogs(logs);
        renderLogs();
    };
    reader.readAsText(file);
});

const body = document.body;
const toggle = darkModeToggle;

const savedTheme = localStorage.getItem('theme') || 'light';
body.classList.add(savedTheme);
toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

toggle.onclick = () => {
    const isDark = body.classList.contains('dark');
    body.classList.toggle('dark');
    body.classList.toggle('light');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    toggle.textContent = isDark ? '🌙' : '☀️';
};

renderLogs();

