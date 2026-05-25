const CHAT_SAUDE_MAIS_INTERVALO_MS = 60 * 1000;
const CHAT_SAUDE_MAIS_MAX_MENSAGENS = 3;

const limiteUsuarios: Record<number, { timestamps: number[] }> = {};

export const isChatSaudeMaisEnabled = () => Boolean(process.env.GROQ_API_KEY);

function getRecentTimestamps(usuarioId: number, agora: number) {
  if (!limiteUsuarios[usuarioId]) {
    limiteUsuarios[usuarioId] = { timestamps: [] };
  }

  const timestampsRecentes = limiteUsuarios[usuarioId].timestamps.filter(
    (timestamp) => agora - timestamp < CHAT_SAUDE_MAIS_INTERVALO_MS,
  );

  limiteUsuarios[usuarioId].timestamps = timestampsRecentes;

  return timestampsRecentes;
}

export const getChatSaudeMaisStatus = (usuarioId: number) => {
  const agora = Date.now();
  const timestampsRecentes = getRecentTimestamps(usuarioId, agora);
  const enabled = isChatSaudeMaisEnabled();
  const canSend = enabled && timestampsRecentes.length < CHAT_SAUDE_MAIS_MAX_MENSAGENS;

  let retryAfterSec = 0;

  if (!canSend && timestampsRecentes.length > 0) {
    const tempoRestanteMs = Math.max(
      CHAT_SAUDE_MAIS_INTERVALO_MS - (agora - timestampsRecentes[0]),
      0,
    );
    retryAfterSec = Math.ceil(tempoRestanteMs / 1000);
  }

  return {
    enabled,
    canLoad: enabled,
    canSend,
    retryAfterSec,
    limit: {
      maxMensagens: CHAT_SAUDE_MAIS_MAX_MENSAGENS,
      intervaloSegundos: CHAT_SAUDE_MAIS_INTERVALO_MS / 1000,
    },
  };
};

export const registerChatSaudeMaisAttempt = (usuarioId: number) => {
  const agora = Date.now();
  const timestampsRecentes = getRecentTimestamps(usuarioId, agora);

  timestampsRecentes.push(agora);
  limiteUsuarios[usuarioId].timestamps = timestampsRecentes;
};
