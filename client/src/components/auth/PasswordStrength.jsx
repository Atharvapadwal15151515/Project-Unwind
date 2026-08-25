function calculatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  return score;
}

function PasswordStrength({ password }) {
  if (!password) {
    return null;
  }

  const score =
    calculatePasswordStrength(password);

  const labels = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Excellent"
  ];

  return (
    <div className="password-strength">
      <div className="password-strength__bars">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <span
              key={index}
              className={
                index < score
                  ? `password-strength__active password-strength__active--${score}`
                  : ""
              }
            />
          )
        )}
      </div>

      <p>
        Password strength:
        <strong> {labels[score]}</strong>
      </p>
    </div>
  );
}

export default PasswordStrength;