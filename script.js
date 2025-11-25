<meta name='viewport' content='width=device-width, initial-scale=1'/>let irLearningIndex = -1;
const menuButton = document.querySelector('.menu-button');

function toggleCard(cardId) {
    const cardContent = document.getElementById(cardId + 'Card');
    const button = document.getElementById(cardId + 'Btn');
    cardContent.classList.toggle('expanded');
    button.classList.toggle('active');
}

function showLoading(message = "BINZEO AUTOMATION SYSTEM...") {
    document.getElementById('loader').style.display = 'flex';
    document.querySelector('.loader-text').textContent = message;
    document.getElementById('loader').style.opacity = '1';
}

function hideLoading() {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 500);
}

function toggleLightControls(index) {
    const nameChangeControls = document.getElementById(`light${index}_name_change_controls`);
    const extraControls = document.getElementById(`light${index}_extra_controls`);
    if (nameChangeControls) {
        nameChangeControls.style.display = (nameChangeControls.style.display === 'none' || nameChangeControls.style.display === '') ? 'block' : 'none';
    }
    if (extraControls) {
        extraControls.style.display = (extraControls.style.display === 'none' || extraControls.style.display === '') ? 'block' : 'none';
    }
}

function toggleNameChange(type, index = -1) {
    let idPrefix = type;
    if (index !== -1) { idPrefix += index; }
    const nameChangeControls = document.getElementById(`${idPrefix}_name_change_controls`);
    if (nameChangeControls) {
        nameChangeControls.style.display = (nameChangeControls.style.display === 'none' || nameChangeControls.style.display === '') ? 'block' : 'none';
    }
}

function showView(viewId) {
    document.getElementById('mainView').style.display = 'none';
    const views = document.querySelectorAll('.view-container');
    views.forEach(view => view.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
    menuButton.classList.add('change');
}

function showGrid() {
    const views = document.querySelectorAll('.view-container');
    views.forEach(view => view.style.display = 'none');
    document.getElementById('mainView').style.display = 'block';
    menuButton.classList.remove('change');
}

function loadStates() {
    fetch('/getStatus')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("Authentication required. Please refresh to log in.");
                    return Promise.reject('Unauthorized');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            for (let i = 0; i < 5; i++) {
                const lightCheckbox = document.querySelector(`#lightsCard .device-container:nth-child(${i + 1}) .switch input[type="checkbox"]`);
                if (lightCheckbox) { lightCheckbox.checked = data.lights[i].state; }
                document.getElementById(`lightName${i}`).textContent = data.lights[i].name;
                document.getElementById(`light${i}_newName`).value = data.lights[i].name;
            }
            document.getElementById('rgbPower').checked = data.rgb.power;
            document.getElementById('redSlider').value = data.rgb.r;
            document.getElementById('greenSlider').value = data.rgb.g;
            document.getElementById('blueSlider').value = data.rgb.b;
            updateRGBPreview();
            document.getElementById('rgbLightName').textContent = data.rgb.name;
            document.getElementById('rgbLight_newName').value = data.rgb.name;
            document.getElementById('displayUserName').textContent = data.userName;
            document.getElementById('displayUserEmail').textContent = data.userEmail;
            const gasAlertDiv = document.getElementById('gasAlert');
            if (data.gasDetected) { gasAlertDiv.style.display = 'block'; } else { gasAlertDiv.style.display = 'none'; }
            document.getElementById('gasThresholdInput').value = data.gasThreshold;
        })
        .catch(error => { console.error('Error fetching status:', error); });
}

function updateSensorData() {
    fetch('/getSensorData')
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => {
            document.getElementById('temperature').textContent = data.temp.toFixed(1);
            document.getElementById('humidity').textContent = data.hum.toFixed(1);
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

function loadLightSchedules() {
    fetch('/getLightSchedules')
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => {
            for (let i = 0; i < 5; i++) {
                const onHour = String(data.schedules[i].onHour).padStart(2, '0');
                const onMinute = String(data.schedules[i].onMinute).padStart(2, '0');
                const offHour = String(data.schedules[i].offHour).padStart(2, '0');
                const offMinute = String(data.schedules[i].offMinute).padStart(2, '0');
                document.getElementById(`light${i}_onTime`).value = `${onHour}:${onMinute}`;
                document.getElementById(`light${i}_offTime`).value = `${offHour}:${offMinute}`;
                document.getElementById(`light${i}_scheduleEnable`).checked = data.schedules[i].scheduleEnabled;
            }
        })
        .catch(error => console.error('Error fetching schedules:', error));
}

function updateLightSchedule(index) {
    const onTime = document.getElementById(`light${index}_onTime`).value;
    const offTime = document.getElementById(`light${index}_offTime`).value;
    const scheduleEnabled = document.getElementById(`light${index}_scheduleEnable`).checked;
    if (!/^\d{2}:\d{2}$/.test(onTime) || !/^\d{2}:\d{2}$/.test(offTime)) { alert("Please enter times in HH:MM format."); return; }
    const [onHour, onMinute] = onTime.split(':').map(Number);
    const [offHour, offMinute] = offTime.split(':').map(Number);
    const params = new URLSearchParams();
    params.append('index', index);
    params.append('onHour', onHour);
    params.append('onMinute', onMinute);
    params.append('offHour', offHour);
    params.append('offMinute', offMinute);
    params.append('scheduleEnabled', scheduleEnabled);
    fetch('/updateLightSchedule', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.text(); })
        .then(result => console.log(`Light ${index} schedule updated:`, result))
        .catch(error => console.error(`Error updating light ${index} schedule:`, error));
}

function toggleLight(index) {
    const scheduleEnableCheckbox = document.getElementById(`light${index}_scheduleEnable`);
    if (scheduleEnableCheckbox.checked) {
        scheduleEnableCheckbox.checked = false;
        updateLightSchedule(index);
    }
    fetch(`/toggleLight?index=${index}`)
        .then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.text(); })
        .then(state => { document.querySelector(`#lightsCard .device-container:nth-child(${index + 1}) .switch input[type="checkbox"]`).checked = state === '1'; })
        .catch(error => console.error(`Error toggling light ${index}:`, error));
}

function toggleRGBPower() {
    const power = document.getElementById('rgbPower').checked;
    const r = document.getElementById('redSlider').value;
    const g = document.getElementById('greenSlider').value;
    const b = document.getElementById('blueSlider').value;
    fetch('/controlRGB', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `power=${power}&r=${r}&g=${g}&b=${b}` })
        .then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.text(); })
        .catch(error => console.error('Error controlling RGB:', error));
    updateRGBPreview();
}

function updateRGB() {
    document.getElementById('redValue').textContent = document.getElementById('redSlider').value;
    document.getElementById('greenValue').textContent = document.getElementById('greenSlider').value;
    document.getElementById('blueValue').textContent = document.getElementById('blueSlider').value;
    if (document.getElementById('rgbPower').checked) { toggleRGBPower(); }
    updateRGBPreview();
}

function updateRGBPreview() {
    const r = document.getElementById('redSlider').value;
    const g = document.getElementById('greenSlider').value;
    const b = document.getElementById('blueSlider').value;
    const power = document.getElementById('rgbPower').checked;
    document.getElementById('rgbPreview').style.backgroundColor = power ? `rgb(${r}, ${g}, ${b})` : 'black';
}

function updateLiveClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('liveClock').textContent = `${hours}:${minutes}:${seconds}`;
}

function updateAdminCredentials() {
    const newUsername = document.getElementById('adminUsername').value;
    const newPassword = document.getElementById('adminPassword').value;
    const statusElement = document.getElementById('credentialStatus');
    if (newUsername.length < 3 || newPassword.length < 3) { statusElement.textContent = "Username and password must be at least 3 characters long."; statusElement.style.color = "orange"; return; }
    const params = new URLSearchParams();
    params.append('username', newUsername);
    params.append('password', newPassword);
    fetch('/updateCredentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => {
            if (response.ok) {
                statusElement.textContent = "Credentials updated successfully! Please refresh and re-login with new credentials.";
                statusElement.style.color = "lightgreen";
                document.getElementById('adminUsername').value = '';
                document.getElementById('adminPassword').value = '';
                setTimeout(() => { alert("Credentials updated. Please refresh the page to log in with new credentials."); window.location.reload(); }, 1000);
            } else { return response.text().then(text => { throw new Error(text); }); }
        })
        .catch(error => { console.error('Error updating credentials:', error); statusElement.textContent = `Error: ${error.message}.`; statusElement.style.color = "red"; });
}

function updateGuestCredentials() {
    const newUsername = document.getElementById('guestUsername').value;
    const newPassword = document.getElementById('guestPassword').value;
    const statusElement = document.getElementById('guestCredentialStatus');
    if (newUsername.length < 3 || newPassword.length < 3) { statusElement.textContent = "Username and password must be at least 3 characters long."; statusElement.style.color = "orange"; return; }
    const params = new URLSearchParams();
    params.append('guest_user', newUsername);
    params.append('guest_pass', newPassword);
    fetch('/updateGuestCredentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => {
            if (response.ok) {
                statusElement.textContent = "Guest credentials updated successfully!";
                statusElement.style.color = "lightgreen";
                document.getElementById('guestUsername').value = '';
                document.getElementById('guestPassword').value = '';
            } else { return response.text().then(text => { throw new Error(text); }); }
        })
        .catch(error => { console.error('Error updating guest credentials:', error); statusElement.textContent = `Error: ${error.message}.`; statusElement.style.color = "red"; });
}

function updateWiFiCredentials() {
    const newSsid = document.getElementById('wifiSsid').value;
    const newPassword = document.getElementById('wifiPassword').value;
    const statusElement = document.getElementById('wifiCredentialStatus');
    if (newSsid.length === 0) { statusElement.textContent = "WiFi SSID cannot be empty."; statusElement.style.color = "orange"; return; }
    if (newPassword.length > 0 && newPassword.length < 8) { statusElement.textContent = "WiFi password should be at least 8 characters long (or leave empty for open network)."; statusElement.style.color = "orange"; return; }
    showLoading("Updating WiFi credentials and reconnecting...");
    const params = new URLSearchParams();
    params.append('ssid', newSsid);
    params.append('password', newPassword);
    fetch('/updateWiFiCredentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => {
            if (response.ok) {
                statusElement.textContent = "WiFi credentials updated. Device is attempting to reconnect...";
                statusElement.style.color = "lightgreen";
                document.getElementById('wifiSsid').value = '';
                document.getElementById('wifiPassword').value = '';
                setTimeout(() => {
                    hideLoading(); alert("WiFi credentials updated. The ESP32 is restarting and attempting to connect to the new network. Please wait a moment and refresh this page, or try accessing the device at its new IP address if it changed.");
                    window.location.reload();
                }, 5000);
            } else { return response.text().then(text => { throw new Error(text); }); }
        })
        .catch(error => { hideLoading(); console.error('Error updating WiFi credentials:', error); statusElement.textContent = `Error: ${error.message}. Please check credentials.`; statusElement.style.color = "red"; });
}

function updateDeviceName(deviceType, index = -1, fromModal = false) {
    let newName; let deviceId; let inputElementId; let modalInputElementId = fromModal ? `${deviceType}${index}_newName_modal` : '';
    if (deviceType === 'light') { inputElementId = `light${index}_newName`; newName = document.getElementById(inputElementId).value; deviceId = `lightName${index}`; }
    else if (deviceType === 'ac') { inputElementId = fromModal ? modalInputElementId : `ac${index}_newName`; newName = document.getElementById(inputElementId).value; deviceId = `acName${index}`; }
    else if (deviceType === 'tv') { inputElementId = 'tv_newName'; newName = document.getElementById(inputElementId).value; deviceId = 'tvName'; }
    else if (deviceType === 'fan') { inputElementId = 'fan_newName'; newName = document.getElementById(inputElementId).value; deviceId = 'fanName'; }
    else if (deviceType === 'rgbLight') { inputElementId = 'rgbLight_newName'; newName = document.getElementById(inputElementId).value; deviceId = 'rgbLightName'; }
    else { console.error("Unknown device type:", deviceType); return; }

    if (newName.trim() === '') { alert('Device name cannot be empty!'); return; }
    const params = new URLSearchParams();
    params.append('type', deviceType); params.append('index', index); params.append('name', newName);
    fetch('/updateDeviceName', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => {
            if (response.ok) {
                document.getElementById(deviceId).textContent = newName;
                if (fromModal) { document.getElementById(`acRemoteTitle${index}`).textContent = newName; }
                else { document.getElementById(`${inputElementId.replace('_newName', '_name_change_controls')}`).style.display = 'none'; }
                alert('Device name updated successfully!');
            } else { return response.text().then(text => { throw new Error(text); }); }
        })
        .catch(error => { console.error('Error updating device name:', error); alert(`Error updating name: ${error.message}`); });
}

function updateIrCodeDisplay() {
    const irCodeDisplay = document.getElementById('lastIrCodeDisplay');
    const irStatusText = document.getElementById('irLearningStatus');
    fetch('/getIrCode')
        .then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.json(); })
        .then(data => {
            if (data.irLearningActive) { irStatusText.textContent = `IR Receiver is actively listening. Learning for Light ${data.irLearningIndex !== -1 ? data.irLearningIndex : 'None'}. Press a button on your remote.`; irStatusText.style.color = '#ffc107'; }
            else { irStatusText.textContent = "IR Receiver is actively listening for signals."; irStatusText.style.color = '#ccc'; }

            if (data.irCode && data.irCode !== "0x0") { irCodeDisplay.textContent = data.irCode; } else { irCodeDisplay.textContent = "No signal detect."; }

            if (data.lightIrCodes) {
                data.lightIrCodes.forEach((code, i) => {
                    const displayElement = document.getElementById(`irCode${i}Display`);
                    if (displayElement) {
                        displayElement.textContent = code === "0x0" ? "Not Learned" : `Learned: ${code}`;
                        displayElement.style.color = code === "0x0" ? 'orange' : '#66bb6a';
                    }
                });
            }
            for (let i = 0; i < 5; i++) {
                const learnButton = document.getElementById(`learnIr${i}`);
                if (learnButton) {
                    if (data.irLearningActive && data.irLearningIndex == i) { learnButton.classList.add('learning'); learnButton.textContent = 'Learning...'; }
                    else { learnButton.classList.remove('learning'); learnButton.textContent = 'Learn IR'; }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching IR code:', error); irCodeDisplay.textContent = "Error fetching IR status."; irCodeDisplay.style.color = 'red';
            irStatusText.textContent = `Connection error for IR receiver: ${error.message}`; irStatusText.style.color = 'red';
        });
}

function startIrLearning(index) {
    irLearningIndex = index;
    const params = new URLSearchParams();
    params.append('index', index);
    fetch('/startIrLearning', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => {
            if (response.ok) {
                document.getElementById('irLearningStatus').textContent = `Press remote button for Light ${index}.`; document.getElementById('irLearningStatus').style.color = '#ffc107';
                for (let i = 0; i < 5; i++) {
                    const btn = document.getElementById(`learnIr${i}`);
                    if (btn) {
                        if (i === index) { btn.classList.add('learning'); btn.textContent = 'Learning...'; }
                        else { btn.classList.remove('learning'); btn.textContent = 'Learn IR'; }
                    }
                }
            } else { return response.text().then(text => { throw new Error(text); }); }
        })
        .catch(error => {
            console.error('Error starting IR learning:', error); document.getElementById('irLearningStatus').textContent = `Error starting learning: ${error.message}`;
            document.getElementById('irLearningStatus').style.color = 'red'; irLearningIndex = -1;
            for (let i = 0; i < 5; i++) { const btn = document.getElementById(`learnIr${i}`); if (btn) { btn.classList.remove('learning'); btn.textContent = 'Learn IR'; } }
        });
}

function resetIrCode(index) {
    if (confirm(`Are you sure you want to reset the IR code for Light ${index}? This cannot be undone without re-learning.`)) {
        const params = new URLSearchParams();
        params.append('index', index);
        fetch('/resetIrCode', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
            .then(response => { if (response.ok) { alert(`IR code for Light ${index} reset successfully.`); updateIrCodeDisplay(); } else { return response.text().then(text => { throw new Error(text); }); } })
            .catch(error => { console.error('Error resetting IR code:', error); alert(`Error resetting IR code: ${error.message}`); });
    }
}

function updateGasThreshold() {
    const thresholdValue = document.getElementById('gasThresholdInput').value;
    const statusEl = document.getElementById('gasThresholdStatus');
    statusEl.textContent = 'Saving...'; statusEl.style.color = 'orange';
    const params = new URLSearchParams(); params.append('threshold', thresholdValue);
    fetch('/updateGasThreshold', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        .then(response => { if (response.ok) { statusEl.textContent = 'Saved!'; statusEl.style.color = 'lightgreen'; } else { return response.text().then(text => { throw new Error(text); }); } setTimeout(() => { statusEl.textContent = ''; }, 3000); })
        .catch(error => { console.error('Error updating gas threshold:', error); statusEl.textContent = `Error: ${error.message}`; statusEl.style.color = 'red'; });
}

const gridButtonsConfig = [
    { id: 'Lights', default: 'LIGHTS' }, { id: 'Rgb', default: 'RGB' }, { id: 'Ac', default: 'AC' }, { id: 'Appliances', default: 'APPLIANCES' },
    { id: 'IrHub', default: 'IR HUB' }, { id: 'IntelliSync', default: 'INTELLISYNC' }, { id: 'Sawt', default: 'SAWT' }, { id: 'Current', default: 'CURRENT' },
    { id: 'RgbAnimation', default: 'RGB ANIMATION' }, { id: 'MotionSensor', default: 'MOTION SENSOR' }
];

function loadGridNames() {
    gridButtonsConfig.forEach(button => {
        const storageKey = 'gridLabel' + button.id;
        const savedName = localStorage.getItem(storageKey);
        const displayName = savedName || button.default;
        const labelElement = document.getElementById('gridLabel' + button.id);
        if (labelElement) { labelElement.textContent = displayName; }
        const inputElement = document.getElementById('gridName' + button.id);
        if (inputElement) { inputElement.value = displayName; }
    });
}

function saveGridNames() {
    const statusElement = document.getElementById('gridNameStatus');
    try {
        gridButtonsConfig.forEach(button => {
            const inputId = 'gridName' + button.id;
            const labelId = 'gridLabel' + button.id;
            const storageKey = 'gridLabel' + button.id;
            const newName = document.getElementById(inputId).value.trim();
            const displayName = newName || button.default;
            localStorage.setItem(storageKey, displayName);
            document.getElementById(labelId).textContent = displayName;
            document.getElementById(inputId).value = displayName;
        });
        statusElement.textContent = "Grid names saved successfully!";
        statusElement.style.color = "lightgreen";
    } catch (error) {
        console.error("Error saving grid names:", error);
        statusElement.textContent = "Error saving names. Check console.";
        statusElement.style.color = "red";
    }
    setTimeout(() => { statusElement.textContent = ''; }, 3000);
}

window.onload = function () {
    hideLoading();
    setInterval(loadStates, 3000);
    setInterval(updateSensorData, 2000);
    setInterval(loadLightSchedules, 5000);
    setInterval(updateIrCodeDisplay, 800);
    setInterval(updateLiveClock, 1000);
    updateLiveClock();
    loadStates();
    loadLightSchedules();
    updateIrCodeDisplay();
    loadGridNames();
};
