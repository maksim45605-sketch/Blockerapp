import { addBalance } from "./wallet.js";

// === НАСТРОЙКИ СЕРВИСОВ И КАРТИНОК ===
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

// Modal Elements
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const actionStep = document.getElementById('actionStep');
const resultStep = document.getElementById('resultStep');
const statusText = document.getElementById('statusText');
const salaryAmount = document.getElementById('salaryAmount');

// Кнопка "Забрать деньги"
const takeBtn = document.querySelector('.btn-take');

let isSpinning = false;
let generatedItems = [];

// ✅ запоминаем зарплату числом, чтобы потом зачислить
let lastSalary = 0;

// Функция заполнения
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

// Первичная инициализация
initRoulette();

spinBtn.addEventListener('click', () => {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  // 1) Сброс позиции
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';

  // 2) Новая последовательность
  initRoulette();

  // 3) Reflow
  track.offsetHeight;

  // 4) Точка остановки
  const targetIndex = Math.floor(Math.random() * (90 - 70 + 1) + 70);
  const containerCenter = track.parentElement.offsetWidth / 2;
  const cardCenter = cardWidth / 2;
  const pixelOffset = (targetIndex * cardWidth) - containerCenter + cardCenter;

  // 5) Старт анимации
  requestAnimationFrame(() => {
    track.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.15, 1)';
    track.style.transform = `translateX(-${pixelOffset}px)`;
  });

  const winner = generatedItems[targetIndex];

  setTimeout(() => {
    openModal(winner);
  }, 5000);
});

function openModal(service) {
  modalImg.src = service.img;
  modalTitle.textContent = service.name;

  modalWindow.className = 'modal-window';
  actionStep.style.display = 'block';
  resultStep.style.display = 'none';

  modalOverlay.classList.add('active');

  // ✅ сброс зарплаты
  lastSalary = 0;
  salaryAmount.textContent = '0 ₽';

  if (takeBtn) {
    takeBtn.disabled = false;
    takeBtn.textContent = 'Забрать деньги';
  }
}

window.applyPunishment = function (type) {
  actionStep.style.display = 'none';
  resultStep.style.display = 'block';
  modalWindow.classList.add('punished');

  statusText.textContent = type;

  const salary = Math.floor(Math.random() * (100 - 10 + 1) + 10) * 1000;
  lastSalary = salary;

  salaryAmount.textContent = salary.toLocaleString('ru-RU') + ' ₽';
};

// ✅ Зачисление в Firebase (вместо location.reload)
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
    await addBalance(lastSalary); // 💰 пополнение

    takeBtn.textContent = 'Зачислено ✅';
    setTimeout(() => {
      window.resetRoulette();
      takeBtn.disabled = false;
      takeBtn.textContent = 'Забрать деньги';
    }, 700);
  } catch (e) {
    takeBtn.textContent = 'Войдите в аккаунт';
    setTimeout(() => {
      takeBtn.disabled = false;
      takeBtn.textContent = 'Забрать деньги';
    }, 1200);

    alert('Нужно войти, чтобы зачислить деньги на аккаунт.');
  }
}

takeBtn?.addEventListener('click', takeMoney);

window.resetRoulette = function () {
  modalOverlay.classList.remove('active');
  isSpinning = false;
  spinBtn.disabled = false;
};
