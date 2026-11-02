/* ============================================================
   PHARMACOKINETICS SIMULATOR — MATHEMATICAL & VISUAL ENGINE
   One-compartment oral absorption & IV bolus multi-dose kinetics
   ============================================================ */

(() => {
    'use strict';

    // Preset Database (Real pharmacokinetic parameters)
    const DRUG_PRESETS = {
        amoxicillin: {
            name: 'Amoxicillin',
            dose: 500,
            interval: 8,
            numDoses: 6,
            halfLife: 1.2,
            vd: 20,
            ka: 1.5,
            bioavail: 90,
            mec: 4.0,
            mtc: 25.0,
            route: 'oral',
            notes: 'High therapeutic index, rapid renal elimination. Well-tolerated antibiotic.'
        },
        paracetamol: {
            name: 'Paracetamol',
            dose: 1000,
            interval: 6,
            numDoses: 6,
            halfLife: 2.5,
            vd: 65,
            ka: 2.2,
            bioavail: 85,
            mec: 10.0,
            mtc: 30.0,
            route: 'oral',
            notes: 'Standard analgesic. Hepatotoxicity risks rise sharply if accumulation crosses MTC (150+ mg/L severe, 30 mg/L warning threshold).'
        },
        ibuprofen: {
            name: 'Ibuprofen',
            dose: 400,
            interval: 8,
            numDoses: 6,
            halfLife: 2.0,
            vd: 10,
            ka: 1.8,
            bioavail: 95,
            mec: 15.0,
            mtc: 50.0,
            route: 'oral',
            notes: 'NSAID with high protein binding and rapid absorption. Anti-inflammatory plateau.'
        },
        theophylline: {
            name: 'Theophylline',
            dose: 300,
            interval: 12,
            numDoses: 6,
            halfLife: 8.0,
            vd: 35,
            ka: 0.8,
            bioavail: 100,
            mec: 10.0,
            mtc: 20.0,
            route: 'oral',
            notes: 'Narrow therapeutic window! Requires careful therapeutic drug monitoring to prevent cardiac arrhythmias.'
        },
        gentamicin: {
            name: 'Gentamicin (IV)',
            dose: 240,
            interval: 24,
            numDoses: 5,
            halfLife: 2.5,
            vd: 18,
            ka: 3.0,
            bioavail: 100,
            mec: 2.0,
            mtc: 12.0,
            route: 'iv',
            notes: 'Aminoglycoside antibiotic. Nephrotoxicity and ototoxicity risks if trough concentrations stay high.'
        }
    };

    // DOM Elements
    const doseSlider = document.getElementById('dose');
    const doseVal = document.getElementById('doseVal');
    const intervalSlider = document.getElementById('interval');
    const intervalVal = document.getElementById('intervalVal');
    const numDosesSlider = document.getElementById('numDoses');
    const numDosesVal = document.getElementById('numDosesVal');
    const halfLifeSlider = document.getElementById('halfLife');
    const halfLifeVal = document.getElementById('halfLifeVal');
    const vdSlider = document.getElementById('vd');
    const vdVal = document.getElementById('vdVal');
    const kaSlider = document.getElementById('ka');
    const kaVal = document.getElementById('kaVal');
    const kaGroup = document.getElementById('kaGroup');
    const bioavailSlider = document.getElementById('bioavail');
    const bioavailVal = document.getElementById('bioavailVal');
    const mecSlider = document.getElementById('mec');
    const mecVal = document.getElementById('mecVal');
    const mtcSlider = document.getElementById('mtc');
    const mtcVal = document.getElementById('mtcVal');

    const routeOralBtn = document.getElementById('routeOral');
    const routeIVBtn = document.getElementById('routeIV');
    const presetPills = document.querySelectorAll('.preset-pill');

    const statusBanner = document.getElementById('statusBanner');
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDesc');

    const kpiCmax = document.getElementById('kpiCmax');
    const kpiCmaxStatus = document.getElementById('kpiCmaxStatus');
    const kpiCmin = document.getElementById('kpiCmin');
    const kpiCminStatus = document.getElementById('kpiCminStatus');
    const kpiCss = document.getElementById('kpiCss');
    const kpiTss = document.getElementById('kpiTss');

    const valKe = document.getElementById('valKe');
    const valCl = document.getElementById('valCl');
    const valR = document.getElementById('valR');
    const clinicalInsight = document.getElementById('clinicalInsight');
    const timeInRangeVal = document.getElementById('timeInRangeVal');
    const timeInRangeBar = document.getElementById('timeInRangeBar');
    const formulaDisplay = document.getElementById('formulaDisplay');

    let currentRoute = 'oral';
    let chartInstance = null;

    // Initialize Chart
    function initChart() {
        const ctx = document.getElementById('pkChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Plasma Concentration (mg/L)',
                        data: [],
                        borderColor: '#38bdf8',
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#38bdf8',
                        tension: 0.25,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(14, 23, 36, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            title: (items) => `Time: ${items[0].label} h`,
                            label: (item) => `Concentration: ${parseFloat(item.raw).toFixed(2)} mg/L`
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time elapsed (hours)',
                            color: '#94a3b8',
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Plasma Level (mg/L)',
                            color: '#94a3b8',
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    }

    // Simulation Engine
    function calculate() {
        const D = parseFloat(doseSlider.value);
        const tau = parseFloat(intervalSlider.value);
        const nDoses = parseInt(numDosesSlider.value, 10);
        const tHalf = parseFloat(halfLifeSlider.value);
        const Vd = parseFloat(vdSlider.value);
        const ka = parseFloat(kaSlider.value);
        const F = parseFloat(bioavailSlider.value) / 100.0;
        const MEC = parseFloat(mecSlider.value);
        const MTC = parseFloat(mtcSlider.value);

        // Update Labels
        doseVal.textContent = `${D} mg`;
        intervalVal.textContent = `${tau} hours`;
        numDosesVal.textContent = `${nDoses} doses`;
        halfLifeVal.textContent = `${tHalf} h`;
        vdVal.textContent = `${Vd} L`;
        kaVal.textContent = `${ka} /h`;
        bioavailVal.textContent = `${Math.round(F * 100)}%`;
        mecVal.textContent = `${MEC.toFixed(1)} mg/L`;
        mtcVal.textContent = `${MTC.toFixed(1)} mg/L`;

        // Pharmacokinetic constants
        const ke = Math.LN2 / tHalf; // elimination rate constant
        const clearance = ke * Vd;   // CL = ke * Vd
        const accFactor = 1 / (1 - Math.exp(-ke * tau)); // Accumulation ratio R
        const timeToSS = 4.5 * tHalf; // 4-5 half-lives

        valKe.textContent = `${ke.toFixed(3)} /h`;
        valCl.textContent = `${clearance.toFixed(2)} L/h`;
        valR.textContent = `${accFactor.toFixed(2)}x`;
        kpiTss.innerHTML = `${timeToSS.toFixed(1)} <span class="unit">hours</span>`;

        // Total simulation duration: until last dose + 4 half-lives
        const totalDuration = (nDoses - 1) * tau + Math.max(tau * 1.5, tHalf * 4);
        const step = Math.min(0.2, totalDuration / 300); // 300 data points

        const labels = [];
        const concentrations = [];

        let cMax = 0;
        let cMin = Infinity;
        let totalPoints = 0;
        let pointsInRange = 0;

        for (let t = 0; t <= totalDuration; t += step) {
            let conc = 0;

            for (let doseIdx = 0; doseIdx < nDoses; doseIdx++) {
                const doseTime = doseIdx * tau;
                if (t >= doseTime) {
                    const dt = t - doseTime;
                    if (currentRoute === 'oral') {
                        // 1-compartment oral absorption model
                        if (Math.abs(ka - ke) > 0.001) {
                            conc += (F * D * ka / (Vd * (ka - ke))) * (Math.exp(-ke * dt) - Math.exp(-ka * dt));
                        } else {
                            conc += (F * D / Vd) * ka * dt * Math.exp(-ke * dt);
                        }
                    } else {
                        // IV Bolus multi-dose: C(t) = (D / Vd) * e^(-ke * dt)
                        conc += (D / Vd) * Math.exp(-ke * dt);
                    }
                }
            }

            labels.push(t.toFixed(1));
            concentrations.push(Math.max(0, conc));

            if (conc > cMax) cMax = conc;
            if (t > tau && conc < cMin) cMin = conc;

            // Stats for therapeutic window
            totalPoints++;
            if (conc >= MEC && conc <= MTC) {
                pointsInRange++;
            }
        }

        if (cMin === Infinity) cMin = 0;

        // Average steady-state concentration: Css,avg = (F * D) / (CL * tau)
        const doseF = currentRoute === 'oral' ? (F * D) : D;
        const cssAvg = doseF / (clearance * tau);

        kpiCmax.innerHTML = `${cMax.toFixed(1)} <span class="unit">mg/L</span>`;
        kpiCmin.innerHTML = `${cMin.toFixed(1)} <span class="unit">mg/L</span>`;
        kpiCss.innerHTML = `${cssAvg.toFixed(1)} <span class="unit">mg/L</span>`;

        // Update Cmax & Cmin status badge
        if (cMax > MTC) {
            kpiCmaxStatus.textContent = '⚠️ Toxic Peak Danger';
            kpiCmaxStatus.className = 'stat-sub warning';
        } else {
            kpiCmaxStatus.textContent = '✓ Safely under toxic limit';
            kpiCmaxStatus.className = 'stat-sub';
        }

        if (cMin < MEC) {
            kpiCminStatus.textContent = '⚠️ Drops below effective level';
            kpiCminStatus.className = 'stat-sub warning';
        } else {
            kpiCminStatus.textContent = '✓ Sustained above minimum';
            kpiCminStatus.className = 'stat-sub';
        }

        // Time in range calculation
        const percentInRange = Math.round((pointsInRange / Math.max(1, totalPoints)) * 100);
        timeInRangeVal.textContent = `${percentInRange}%`;
        timeInRangeBar.style.width = `${percentInRange}%`;

        // Status Banner & Clinical Insight
        if (cMax > MTC) {
            statusBanner.className = 'status-banner toxic';
            statusIcon.textContent = '☣️';
            statusTitle.textContent = 'Toxicity Warning Detected';
            statusDesc.textContent = `Peak concentration (${cMax.toFixed(1)} mg/L) crosses the minimum toxic concentration (${MTC} mg/L). Consider extending dosing interval (τ) or lowering dose.`;
            clinicalInsight.textContent = `High risk of adverse drug reactions or toxicity. Clearance is insufficient to eliminate previous dose before next intake.`;
        } else if (cMin < MEC && cMax >= MEC) {
            statusBanner.className = 'status-banner sub';
            statusIcon.textContent = '⚠️';
            statusTitle.textContent = 'Sub-therapeutic Trough Fluctuations';
            statusDesc.textContent = `Drug concentration drops below effective threshold (${MEC} mg/L) between doses. Bacteria/symptoms may rebound.`;
            clinicalInsight.textContent = `Dosing interval (τ = ${tau}h) is too long relative to half-life (t½ = ${tHalf}h). Shortening interval or sustained release formulation recommended.`;
        } else if (cMax < MEC) {
            statusBanner.className = 'status-banner sub';
            statusIcon.textContent = '📉';
            statusTitle.textContent = 'Ineffective Under-dosing';
            statusDesc.textContent = `Peak concentration does not reach minimum effective concentration (${MEC} mg/L). Regimen has no therapeutic effect.`;
            clinicalInsight.textContent = `Dose is too small for the distribution volume (Vd = ${Vd} L). Increase dose per intake.`;
        } else {
            statusBanner.className = 'status-banner safe';
            statusIcon.textContent = '🛡️';
            statusTitle.textContent = 'Optimal Therapeutic Regimen';
            statusDesc.textContent = `Steady-state concentrations safely stay inside the therapeutic window (${MEC} – ${MTC} mg/L).`;
            clinicalInsight.textContent = `Balanced accumulation! Plasma level remains consistently therapeutic with high efficacy and minimal toxicity risk.`;
        }

        // Update Chart
        updateChartDisplay(labels, concentrations, MEC, MTC);
    }

    function updateChartDisplay(labels, data, mec, mtc) {
        if (!chartInstance) return;

        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = data;

        // Custom canvas background zones or annotations
        const maxY = Math.max(mtc * 1.35, Math.max(...data) * 1.15, 10);
        chartInstance.options.scales.y.max = maxY;

        chartInstance.options.plugins.annotation = {
            annotations: {
                toxicZone: {
                    type: 'box',
                    yMin: mtc,
                    yMax: maxY,
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    borderWidth: 0
                },
                therapeuticZone: {
                    type: 'box',
                    yMin: mec,
                    yMax: mtc,
                    backgroundColor: 'rgba(16, 185, 129, 0.07)',
                    borderWidth: 0
                },
                mtcLine: {
                    type: 'line',
                    yMin: mtc,
                    yMax: mtc,
                    borderColor: '#f43f5e',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    label: {
                        display: true,
                        content: `MTC: ${mtc} mg/L`,
                        position: 'end',
                        backgroundColor: '#f43f5e',
                        color: '#fff',
                        font: { size: 10 }
                    }
                },
                mecLine: {
                    type: 'line',
                    yMin: mec,
                    yMax: mec,
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    label: {
                        display: true,
                        content: `MEC: ${mec} mg/L`,
                        position: 'end',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        font: { size: 10 }
                    }
                }
            }
        };

        chartInstance.update();
    }

    // Set Drug Preset
    function applyPreset(key) {
        const drug = DRUG_PRESETS[key];
        if (!drug) return;

        doseSlider.value = drug.dose;
        intervalSlider.value = drug.interval;
        numDosesSlider.value = drug.numDoses;
        halfLifeSlider.value = drug.halfLife;
        vdSlider.value = drug.vd;
        kaSlider.value = drug.ka;
        bioavailSlider.value = drug.bioavail;
        mecSlider.value = drug.mec;
        mtcSlider.value = drug.mtc;

        setRoute(drug.route);
        calculate();
    }

    function setRoute(route) {
        currentRoute = route;
        if (route === 'oral') {
            routeOralBtn.classList.add('active');
            routeIVBtn.classList.remove('active');
            kaGroup.style.display = 'block';
            formulaDisplay.innerHTML = '$$C(t) = \\sum_{k=0}^{n-1} \\frac{F \\cdot D \\cdot k_a}{V_d (k_a - k_e)} \\left( e^{-k_e(t - k\\tau)} - e^{-k_a(t - k\\tau)} \\right)$$';
        } else {
            routeIVBtn.classList.add('active');
            routeOralBtn.classList.remove('active');
            kaGroup.style.display = 'none';
            formulaDisplay.innerHTML = '$$C(t) = \\sum_{k=0}^{n-1} \\frac{D}{V_d} \\cdot e^{-k_e(t - k\\tau)}$$';
        }
    }

    // Event Listeners
    const inputs = [
        doseSlider, intervalSlider, numDosesSlider, halfLifeSlider,
        vdSlider, kaSlider, bioavailSlider, mecSlider, mtcSlider
    ];

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Remove active status from presets on manual change
            presetPills.forEach(p => p.classList.remove('active'));
            calculate();
        });
    });

    routeOralBtn.addEventListener('click', () => {
        setRoute('oral');
        calculate();
    });

    routeIVBtn.addEventListener('click', () => {
        setRoute('iv');
        calculate();
    });

    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            presetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            applyPreset(pill.dataset.drug);
        });
    });

    // Boot
    initChart();
    applyPreset('amoxicillin');
})();
