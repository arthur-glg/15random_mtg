document.getElementById('drawButton').addEventListener('click', drawCards);

const manaCurveChartCtx = document.getElementById('manaCurveChart').getContext('2d');
const manaCurveChart = new Chart(manaCurveChartCtx, {
    type: 'bar',
    data: {
        labels: ['No Mana', '0', '1', '2', '3', '4', '5', '6', '7+'],
        datasets: [{
            label: 'Mana Curve',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

const colorChartCtx = document.getElementById('colorChart').getContext('2d');
const colorChart = new Chart(colorChartCtx, {
    type: 'pie',
    data: {
        labels: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless'],
        datasets: [{
            label: 'Color Distribution',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: ['#F5F5DC', '#007DC6', '#000000', '#D40000', '#008001', '#D3D3D3'],
            borderColor: ['#F5F5DC', '#007DC6', '#000000', '#D40000', '#008001', '#D3D3D3'],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        const dataset = colorChart.data.datasets[tooltipItem.datasetIndex];
                        const total = dataset.data.reduce((previousValue, currentValue, currentIndex, array) => previousValue + currentValue);
                        const currentValue = dataset.data[tooltipItem.dataIndex];
                        const percentage = ((currentValue / total) * 100).toFixed(2);
                        return `${tooltipItem.label}: ${percentage}%`;
                    }
                }
            }
        }
    }
});

let selectedCards = [];

async function drawCards() {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = ''; // Clear previous cards

    for (let i = 0; i < 15; i++) {
        let card;
        do {
            const response = await axios.get('https://api.scryfall.com/cards/random');
            card = response.data;
        } while (card.type_line.includes('Basic Land'));

        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <img src="${card.image_uris.large}" alt="${card.mana_cost || 0} — ${card.name}">
        `;
        cardElement.addEventListener('click', () => {
            addToSelectedCards(card);
            drawCards(); // Redraw cards after selecting
        });
        cardContainer.appendChild(cardElement);
    }
}

function addToSelectedCards(card) {
    selectedCards.push(card);
    updateSelectedCardsDisplay();
    updateManaCurve(selectedCards.map(card => card.cmc || (card.type_line.includes('Land') ? -1 : 0)));
    updateColorChart(selectedCards);
    updateCardInfoTextarea(selectedCards);
}

function updateSelectedCardsDisplay() {
    const selectedCardsContainer = document.getElementById('selectedCards');
    selectedCardsContainer.innerHTML = ''; // Clear previous selected cards
    selectedCards.sort((a, b) => (a.cmc || 0) - (b.cmc || 0));
    selectedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'selectedCard';
        cardElement.innerHTML = `
            <img src="${card.image_uris.large}" alt="${card.mana_cost || 0} — ${card.name}">
        `;
        selectedCardsContainer.appendChild(cardElement);
    });
}

function updateManaCurve(cmcValues) {
    const manaCurveData = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    cmcValues.forEach(cmc => {
        if (cmc === -1) {
            manaCurveData[0]++;
        } else if (cmc >= 7) {
            manaCurveData[8]++;
        } else {
            manaCurveData[cmc + 1]++;
        }
    });

    manaCurveChart.data.datasets[0].data = manaCurveData;
    manaCurveChart.update();
}

function updateColorChart(cards) {
    const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    cards.forEach(card => {
        const colors = card.color_identity || [];
        if (colors.length === 0) {
            colorCounts.C++;
        } else {
            colors.forEach(color => {
                colorCounts[color]++;
            });
        }
    });

    colorChart.data.datasets[0].data = [
        colorCounts.W,
        colorCounts.U,
        colorCounts.B,
        colorCounts.R,
        colorCounts.G,
        colorCounts.C
    ];
    colorChart.update();
}

function updateCardInfoTextarea(cards) {
    const cardInfoTextarea = document.getElementById('cardInfoTextarea');
    const cardInfo = cards.map(card => `${card.name} — ${card.mana_cost || 0}`).join('\n');
    cardInfoTextarea.value = cardInfo;
}
