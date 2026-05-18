<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://librasalvador.onrender.com';

onMounted(() => {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');
  if (!userId || userRole !== 'aluno') return;

  socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

  // Novo curso disponível
  socket.on(`aluno:${userId}:novoCurso`, (data) => {
    toast.success(`🎓 Novo curso disponível: "${data.cursoNome}"`, {
      autoClose: 8000,
      position: 'top-right',
      pauseOnHover: true,
      style: {
        background: '#ecfdf5',
        color: '#065f46',
        borderLeft: '4px solid #10b981',
        fontSize: '0.85rem'
      }
    });
  });

  // Menção no fórum
  if (userName) {
    const nomeSimples = userName.split(' ')[0];
    socket.on(`mencao:${nomeSimples}`, (data) => {
      toast.info(`💬 ${data.de} mencionou você no fórum: "${data.topico}"`, {
        autoClose: 8000,
        position: 'top-right',
        pauseOnHover: true,
        style: {
          background: '#eff6ff',
          color: '#1e40af',
          borderLeft: '4px solid #3b82f6',
          fontSize: '0.85rem'
        }
      });
    });
  }
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>
