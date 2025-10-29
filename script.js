// script.js - Main logic for rendering, search, "Roll Bhai", and the new "Roll Baap" feature.

document.addEventListener('DOMContentLoaded', () => {
    // Check if data is loaded (assuming data.js loads studentData and rollBaapMap globally)
    if (typeof studentData === 'undefined' || typeof rollBaapMap === 'undefined') {
        console.error("Data files (studentData or rollBaapMap) not loaded. Please ensure data.js is correctly linked and populated.");
        document.getElementById('cadetsContainer').innerHTML = '<p style="color: red;">Error: Cadet data could not be loaded. Check your data.js file.</p>';
        return;
    }

    const cadetsContainer = document.getElementById('cadetsContainer');
    const searchInput = document.getElementById('searchInput');
    const rollBhaiList = document.getElementById('rollBhaiList');
    const rollBaapDropdown = document.getElementById('rollBaapDropdown'); 
    const cadetCountElement = document.getElementById('cadetCount');
    const noResults = document.getElementById('noResults');

    // --- Data Pre-processing for Roll Bhai and Sections ---
    const rollBhaiMap = new Map();
    const sectionCadets = {};

    studentData.forEach(cadet => {
        // Calculate Roll Bhai Key (Last two digits of Roll No.)
        const rollString = String(cadet['Roll No.']);
        // Ensure the roll key is always two digits (e.g., '91', '01')
        const rollBhaiKey = rollString.length >= 2 ? rollString.slice(-2) : rollString.padStart(2, '0');
        
        if (!rollBhaiMap.has(rollBhaiKey)) {
            rollBhaiMap.set(rollBhaiKey, []);
        }
        rollBhaiMap.get(rollBhaiKey).push(cadet);

        // Group by Section
        const sectionName = cadet.Section;
        if (sectionName) {
            if (!sectionCadets[sectionName]) {
                sectionCadets[sectionName] = [];
            }
            sectionCadets[sectionName].push(cadet);
        }
    });

    // --- Utility Functions ---

    /**
     * Creates the HTML card for a single cadet.
     */
    const createCadetCard = (cadet) => {
        const rollBhaiKey = String(cadet['Roll No.']).slice(-2);
        const admissionDetail = (cadet['Dt. Of Admission'] === 'Upgraded' || cadet['Upgraded from'].includes('Upgraded'))
            ? `${cadet['Upgraded from'] || cadet['Dt. Of Admission']}`
            : cadet['Dt. Of Admission'];
        
        // Added data attributes for click handling
        return `
            <div class="cadet-card" data-roll-bhai-key="${rollBhaiKey}" data-roll-baap-key="${rollBhaiKey}" data-roll-no="${cadet['Roll No.']}">
                <h3>${cadet['Candidate Name']}</h3>
                <p><strong>Roll No.:</strong> ${cadet['Roll No.']}</p>
                <p><strong>Section:</strong> ${cadet.Section || 'N/A'}</p>
                <p><strong>Rank:</strong> ${cadet.Rank}</p>
                <p><strong>Regd. No.:</strong> ${cadet['Regd. No.']}</p>
                <p><strong>Category:</strong> ${cadet['Latest Allotted Category']} (${cadet['Candidate Category']})</p>
                <p><strong>Admission Details:</strong> ${admissionDetail || 'N/A'}</p>
                <p><strong>Email:</strong> ${cadet.Email}</p>
                <p><strong>Mobile:</strong> ${cadet['Mobile Number'] || 'N/A'}</p>
            </div>
        `;
    };

    /**
     * Renders a list of cadets into the container.
     */
    const renderCadets = (cadets) => {
        cadetsContainer.innerHTML = '';
        cadetCountElement.textContent = cadets.length;
        
        if (cadets.length === 0) {
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        cadets.sort((a, b) => a['Roll No.'] - b['Roll No.']);

        let htmlContent = '';
        cadets.forEach(cadet => {
            htmlContent += createCadetCard(cadet);
        });
        cadetsContainer.innerHTML = htmlContent;

        // Attach event listeners to the newly rendered cards
        document.querySelectorAll('.cadet-card').forEach(card => {
            card.addEventListener('click', handleCardClick);
        });
    };
    
    /**
     * Helper function to populate the Roll Baap dropdown section.
     */
    const populateRollBaap = (rollKey, cadetName) => {
        const paddedRollKey = rollKey.padStart(2, '0');
        const baapData = rollBaapMap[paddedRollKey];
        
        let htmlContent = `
            <h4>Seniors matching Roll Ending in **${paddedRollKey}** for ${cadetName}</h4>
        `;

        if (baapData && Object.keys(baapData).length > 0) {
            // Sort batches from senior-most to junior-most (2022-26 -> 2024-28)
            const sortedBatches = Object.keys(baapData).sort(); 
            
            // Reverse the array to show 2022-26 first (Roll Baap)
            sortedBatches.reverse().forEach(batch => {
                const seniors = baapData[batch];
                htmlContent += `
                    <div class="roll-baap-batch">
                        <h5>Batch ${batch} (${seniors.length} matches):</h5>
                        ${seniors.map(senior => 
                            `<span>${senior.Name} (Roll No. ${senior['Roll No.']})</span>`
                        ).join('')}
                    </div>
                `;
            });
        } else {
            htmlContent += '<p>No Roll Baap found in the 2022-26, 2023-27, or 2024-28 batches with this roll ending.</p>';
        }

        rollBaapDropdown.innerHTML = `<div class="roll-baap-group">${htmlContent}</div>`;
    };

    /**
     * Handles the click event on a cadet card.
     */
    const handleCardClick = (event) => {
        const clickedCard = event.currentTarget;
        const rollKey = clickedCard.getAttribute('data-roll-bhai-key');
        const rollNo = parseInt(clickedCard.getAttribute('data-roll-no'));
        const cadetName = clickedCard.querySelector('h3').textContent;

        // 1. ROLL BHAI LOGIC (Current Batch Match)
        const rollBhaiGroup = rollBhaiMap.get(rollKey);
        const rollBhaiNames = rollBhaiGroup
            .filter(c => c['Roll No.'] !== rollNo) 
            .map(c => `<span>${c['Candidate Name']} (Roll No. ${c['Roll No.']})</span>`);

        let rollBhaiHtml = `
            <h4>Roll Bhai for ${cadetName} (Roll Ending in **${rollKey.padStart(2, '0')}**)</h4>
        `;

        if (rollBhaiNames.length > 0) {
            rollBhaiHtml += rollBhaiNames.join('');
        } else {
            rollBhaiHtml += '<p>No other Roll Bhai found with the same last two digits in this batch.</p>';
        }

        rollBhaiList.innerHTML = `<div class="roll-bhai-group">${rollBhaiHtml}</div>`;


        // 2. ROLL BAAP LOGIC (Senior Batch Match)
        populateRollBaap(rollKey, cadetName);

        // Scroll to the Roll Baap section for visibility
        rollBaapDropdown.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /**
     * Generates and renders the batch summary statistics.
     */
    const renderSummary = () => {
        const totalCadets = studentData.length;
        const actualWithdrawnCount = studentData.filter(c => c['Candidate Name'].includes('(Withdrawn)')).length; 
        const totalFemales = studentData.filter(c => c.Gender === 'Female').length;
        const totalMales = totalCadets - totalFemales;
        const upgradedCount = studentData.filter(c => 
            c['Dt. Of Admission'].includes('Upgraded') || 
            (c['Upgraded from'] && (c['Upgraded from'].includes('Upgraded') || c['Upgraded from'].includes('Transferred from')))
        ).length;
        
        const summaryData = document.getElementById('summary-data');
        summaryData.innerHTML = `
            <div class="summary-item"><h4>${totalCadets}</h4><p>Total Cadets</p></div>
            <div class="summary-item"><h4>${totalMales}</h4><p>Total Males</p></div>
            <div class="summary-item"><h4>${totalFemales}</h4><p>Total Females</p></div>
            <div class="summary-item"><h4>${upgradedCount}</h4><p>Upgraded/Transferred</p></div>
            <div class="summary-item"><h4>${Object.keys(sectionCadets).length}</h4><p>Sections (A-G)</p></div>
            <div class="summary-item"><h4>${actualWithdrawnCount}</h4><p>Withdrawn Entries</p></div>
        `;
    };


    // --- Optimized Search Logic with Debounce ---

    const debounce = (func, delay = 150) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    const filterCadets = (searchTerm) => {
        if (!searchTerm) {
            renderCadets(studentData);
            return;
        }

        const filteredCadets = studentData.filter(cadet => {
            const fieldsToSearch = [
                cadet['Candidate Name'].toLowerCase(),
                String(cadet['Roll No.']),
                String(cadet['Regd. No.']),
                cadet['Latest Allotted Category'].toLowerCase(),
                cadet['Candidate Category'].toLowerCase()
            ];
            
            return fieldsToSearch.some(field => field.includes(searchTerm));
        });
        
        renderCadets(filteredCadets);
    };

    const debouncedFilter = debounce(filterCadets, 200);

    // --- Event Listener for Optimized Search ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        debouncedFilter(searchTerm);
    });

    // --- Initial Load ---
    renderSummary();
    renderCadets(studentData);
});