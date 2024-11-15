window.addEventListener('load', function() {
    // Data arrays and tracking
    const data = {
        voltage: {
            values: [],
            min: Infinity,
            max: -Infinity,
            current: 0
        },
        power: {
            values: [],
            min: Infinity,
            max: -Infinity,
            current: 0
        }
    };
    const labels = [];
    const maxDataPoints = 60;

    // Chart configuration
    const chartConfig = {
        voltage: {
            borderColor: '#2196F3',
            label: 'Voltage (V)',
            yMin: 220,
            yMax: 240,
            decimals: 1
        },
        power: {
            borderColor: '#4CAF50',
            label: 'Power (W)',
            yMin: 0,
            yMax: 50,
            decimals: 1
        }
    };

    // Create voltage chart
    const voltageChart = new Chart(document.getElementById('voltageChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartConfig.voltage.label,
                data: data.voltage.values,
                borderColor: chartConfig.voltage.borderColor,
                tension: 0.2,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    min: chartConfig.voltage.yMin,
                    max: chartConfig.voltage.yMax,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        stepSize: 2
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Min: --, Max: --',
                    padding: {
                        bottom: 10
                    }
                }
            }
        }
    });

    // Create power chart with similar config
    const powerChart = new Chart(document.getElementById('powerChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartConfig.power.label,
                data: data.power.values,
                borderColor: chartConfig.power.borderColor,
                tension: 0.2,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    min: chartConfig.power.yMin,
                    max: chartConfig.power.yMax,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        stepSize: 0.5
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Min: --, Max: --',
                    padding: {
                        bottom: 10
                    }
                }
            }
        }
    });

    function updateMinMax(type, value) {
        data[type].current = value;
        data[type].min = Math.min(data[type].min, value);
        data[type].max = Math.max(data[type].max, value);
        return `Min: ${data[type].min.toFixed(1)}, Max: ${data[type].max.toFixed(1)}`;
    }

    // Add carbon footprint tracking
    const CO2_RATE = 0.400; // Thailand's rate: 0.400 kg/kWh
    let totalCarbon = 0;

    function updateDashboard() {
        fetch('/api/energy-data')
            .then(res => res.json())
            .then(newData => {
                if (newData && newData.v) {
                    // Update display values
                    document.querySelector('#voltage').textContent = newData.v.toFixed(1) + ' V';
                    document.querySelector('#current').textContent = newData.c.toFixed(3) + ' A';
                    document.querySelector('#power').textContent = newData.p.toFixed(1) + ' W';
                    document.querySelector('#energy').textContent = newData.e.toFixed(3) + ' kWh';
                    document.querySelector('#frequency').textContent = newData.f.toFixed(1) + ' Hz';
                    document.querySelector('#pf').textContent = newData.pf.toFixed(2);

                    // Update time labels
                    const now = new Date().toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    labels.push(now);

                    // Update data arrays
                    data.voltage.values.push(newData.v);
                    data.power.values.push(newData.p);

                    // Update min/max
                    voltageChart.options.plugins.title.text = updateMinMax('voltage', newData.v);
                    powerChart.options.plugins.title.text = updateMinMax('power', newData.p);

                    // Maintain fixed window of data
                    if (labels.length > maxDataPoints) {
                        labels.shift();
                        data.voltage.values.shift();
                        data.power.values.shift();
                    }

                    // Calculate carbon footprint
                    const carbonFootprint = newData.e * CO2_RATE;
                    document.querySelector('#carbon').textContent = 
                        carbonFootprint.toFixed(3) + ' kg CO2';

                    // Update charts
                    voltageChart.update('none');
                    powerChart.update('none');
                }
            })
            .catch(err => console.error('Fetch error:', err));
    }

    // Add download report button handler
    document.querySelector('#download-report').addEventListener('click', function() {
        window.location.href = '/api/carbon-report';
    });

    // Start updates
    updateDashboard();
    setInterval(updateDashboard, 1000);
});