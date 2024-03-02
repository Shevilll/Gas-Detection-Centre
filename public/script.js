const thresholdValue = 300; // Threshold value for gas concentration

document.addEventListener("DOMContentLoaded", () => {
    const valueElement = document.getElementById("value");
    const voltageElement = document.getElementById("voltage");
    const threshold = document.getElementById("thresholdvalue");
    const highestvalue = document.getElementById("highestvalue");
    const lowestvalue = document.getElementById("lowestvalue");
    const highestvoltage = document.getElementById("highestvoltage");
    const lowestvoltage = document.getElementById("lowestvoltage");

    const valueChartCtx = document
        .getElementById("valueChart")
        .getContext("2d");
    const voltageChartCtx = document
        .getElementById("voltageChart")
        .getContext("2d");

    const valueChart = new Chart(valueChartCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Gas Sensor Value",
                    data: [],
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                xAxes: [
                    {
                        type: "realtime",
                    },
                ],
            },
        },
    });

    const voltageChart = new Chart(voltageChartCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Gas Sensor Voltage",
                    data: [],
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                xAxes: [
                    {
                        type: "realtime",
                    },
                ],
            },
        },
    });

    function updateCharts(valueData, voltageData) {
        valueChart.data.labels = [];
        valueChart.data.datasets[0].data = [];
        voltageChart.data.labels = [];
        voltageChart.data.datasets[0].data = [];

        valueData.forEach((data) => {
            valueChart.data.labels.push(data.timestamp);
            valueChart.data.datasets[0].data.push(data.value);
        });

        voltageData.forEach((data) => {
            voltageChart.data.labels.push(data.timestamp);
            voltageChart.data.datasets[0].data.push(data.voltage);
        });

        valueChart.update();
        voltageChart.update();
    }

    function fetchData() {
        fetch("/valueData")
            .then((response) => response.json())
            .then((valueData) => {
                fetch("/voltageData")
                    .then((response) => response.json())
                    .then((voltageData) => {
                        updateCharts(valueData, voltageData);
                    })
                    .catch((error) => {
                        console.error("Error fetching voltage data:", error);
                    });
            })
            .catch((error) => {
                console.error("Error fetching value data:", error);
            });
    }

    fetchData();

    setInterval(fetchData, 1000);

    setInterval(() => {
        fetch("/data")
            .then((response) => response.json())
            .then((data) => {
                valueElement.textContent = data.value;
                threshold.textContent = "Threshold Value: " + thresholdValue;
                voltageElement.textContent = data.voltage.toFixed(2) + " V";
                if (data.value < thresholdValue) {
                    valueElement.style.color = "green";
                } else {
                    valueElement.style.color = "red";
                }
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, 1000);

    setInterval(() => {
        fetch("/highestdata")
            .then((response) => response.json())
            .then((data) => {
                highestvalue.textContent = "Highest Value: " + data.maxvalue;
                lowestvalue.textContent = "Lowest Value: " + data.minvalue;
                highestvoltage.textContent =
                    "Highest Voltage: " + data.maxvoltage + " V";
                lowestvoltage.textContent =
                    "Lowest Voltage: " + data.minvoltage + " V";
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, 1000);
});
