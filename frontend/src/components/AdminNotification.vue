<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { toast } from 'vue3-toastify';
import { useRouter } from 'vue-router';
import 'vue3-toastify/dist/index.css';

const router = useRouter();
let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://librasalvador.onrender.com';

onMounted(() => {
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin') return;

  socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

  socket.on('adminLog', (log) => {
    const acao = log.action || 'Ação desconhecida';
    const usuario = log.userName || 'Admin Restrito';
    
    toast.info(`🔔 ${usuario} realizou: ${acao}`, {
      autoClose: 10000,
      position: 'top-right',
      closeOnClick: false,
      pauseOnHover: true,
      style: {
        background: '#1e293b',
        color: 'white',
        borderLeft: '4px solid #f59e0b',
        fontSize: '0.85rem'
      },
      onClick: () => {
        router.push('/admin/logs');
      }
    });
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>
