module.exports = function register(commands) {
  commands.set('echo', async ({ sock, chatId, args }) => {
    const text = args.join(' ') || 'Hello!';
    await sock.sendMessage(chatId, { text });
  });
  commands.set('hello', async ({ sock, chatId }) => {
    await sock.sendMessage(chatId, { text: 'Hi there! 👋' });
  });
};
