import { addBalance } from "./wallet.js";

const servicesData = [
  { name: 'ChatGPT', img: 'static/img/ChatGPT.png' },
  { name: 'Roblox', img: 'static/img/roblox.png' },
  { name: 'Standoff2', img: 'static/img/standoff2.png' },
  { name: 'CapCut', img: 'static/img/CapCut.png' },
  { name: 'YouTube', img: 'static/img/YouTube.png' },
  { name: 'Instagram', img: 'static/img/Instagram.png' },
  { name: 'Discord', img: 'static/img/Discord.png' },
  { name: 'Twitch', img: 'static/img/Twitch.png' },
  { name: 'X', img: 'static/img/X.png' },
  { name: 'Netflix', img: 'static/img/Netflix.png' },
  { name: 'TikTok', img: 'static/img/TikTok.png' },
  { name: 'VPN', img: 'static/img/VPN.jpg' },
  { name: 'Google', img: 'static/img/Google.png' },
  { name: 'Telegram', img: 'static/img/Telegram.png' },
  { name: 'WhatsApp', img: 'static/img/WhatsApp.png' },
  { name: 'Teams', img: 'static/img/Teams.png' },
  { name: 'Viber', img: 'static/img/Viber.png' },
  { name: 'Zoom', img: 'static/img/Zoom.png' },
  { name: 'Steam', img: 'static/img/Steam.png' },
  { name: 'Epic Games', img: 'static/img/EpicGames.png' },
];

const cardWidth = 150;
const track = document.getElementById('track');
const spinBtn = document.getElementById('spinBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalWindow = document.getElementById('modalWindow');

const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const actionStep = document.getElementById('actionStep');
const resultStep = document.getElementById('resultStep');
const statusText = document.getElementById('statusText');
const salaryAmount = document.getElementById('salaryAmount');
const takeBtn = document.querySelector('.btn-take');

let isSpinning = false;
let generatedItems = [];
let lastSalary = 0;

function initRoulette() {
  let html = '';
  generatedItems = [];
  const totalItems = 100;

  for (let i = 0; i < totalItems; i++) {
    const randomService = servicesData[Math.floor(Math.random() * servicesData.length)];
    generatedItems.push(randomService);

    html += `
      <div class="service-card" style="width: 140px;">
        <img src="${randomService.img}" class="service-img" alt="${randomService.name}">
        <div>${randomService.name}</div>
      </div>
    `;
  }
  track.innerHTML = html;
}

initRoulette();

spinBtn.addEventListener('click', () => {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';

  initRoulette();
  track.offsetHeight;

  const targetIndex = Math.floor(Math.random() * (90 - 70 + 1) + 70);
  const containerCenter = track.parentElement.offsetWidth / 2;
  const cardCenter = cardWidth / 2;
  const pixelOffset = (targetIndex * cardWidth) - containerCenter + cardCenter;

  requestAnimationFrame(() => {
    track.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.15, 1)';
    track.style.transform = `translateX(-${pixelOffset}px)`;
  });

  const winner = generatedItems[targetIndex];
  setTimeout(() => openModal(winner), 5000);
});

function openModal(service) {
  modalImg.src = service.img;
  modalTitle.textContent = service.name;

  modalWindow.className = 'modal-window';
  actionStep.style.display = 'block';
  resultStep.style.display = 'none';
  modalOverlay.classList.add('active');

  lastSalary = 0;
  salaryAmount.textContent = '0 ₽';

  if (takeBtn) {
    takeBtn.disabled = false;
    takeBtn.textContent = 'Забрать деньги';
  }
}

window.applyPunishment = function(type) {
  actionStep.style.display = 'none';
  resultStep.style.display = 'block';
  modalWindow.classList.add('punished');

  statusText.textContent = type;

  const salary = Math.floor(Math.random() * (100 - 10 + 1) + 10) * 1000;
  lastSalary = salary;
  salaryAmount.textContent = salary.toLocaleString('ru-RU') + ' ₽';
};

async function takeMoney() {
  if (!takeBtn) return;

  if (!lastSalary || lastSalary <= 0) {
    takeBtn.textContent = 'Нечего зачислять';
    setTimeout(() => (takeBtn.textContent = 'Забрать деньги'), 900);
    return;
  }

  takeBtn.disabled = true;
  takeBtn.textContent = 'Зачисление...';

  try {
    await addBalance(lastSalary);
    takeBtn.textContent = 'Зачислено ✅';
    setTimeout(() => {
      window.resetRoulette();
      takeBtn.disabled = false;
      takeBtn.textContent = 'Забрать деньги';
    }, 700);
  } catch (e) {
    console.error("takeMoney error:", e);
    takeBtn.textContent = 'Ошибка';
    setTimeout(() => {
      takeBtn.disabled = false;
      takeBtn.textContent = 'Забрать деньги';
    }, 1200);

    if (e?.code === "NOT_AUTH" || e?.message === "NOT_AUTH") {
      alert('Нужно войти в аккаунт, чтобы зачислить деньги.');
    } else {
      alert('Не удалось зачислить. Открой консоль (F12) и посмотри ошибку.');
    }
  }
}

takeBtn?.addEventListener('click', takeMoney);

window.resetRoulette = function() {
  modalOverlay.classList.remove('active');
  isSpinning = false;
  spinBtn.disabled = false;
};
