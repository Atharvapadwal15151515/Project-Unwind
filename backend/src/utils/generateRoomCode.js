export function generateRoomCode(length = 8) {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }

  return code;
}