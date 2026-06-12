export async function sendOTP(email, code) {
  console.log(`\n-----------------------------------------`);
  console.log(`[EMAIL] Your NextSprint verification code is: ${code}`);
  console.log(`Sent to: ${email}`);
  console.log(`-----------------------------------------\n`);
}
