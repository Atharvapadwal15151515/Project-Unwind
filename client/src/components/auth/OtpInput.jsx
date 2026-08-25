import { useRef } from "react";

function OtpInput({
  value,
  onChange,
  length = 6
}) {
  const inputsRef = useRef([]);

  const digits = Array.from(
    { length },
    (_, index) => value[index] || ""
  );

  const updateDigit = (index, digit) => {
    const nextDigits = [...digits];

    nextDigits[index] = digit;

    onChange(nextDigits.join(""));

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleChange = (index, event) => {
    const digit = event.target.value
      .replace(/\D/g, "")
      .slice(-1);

    updateDigit(index, digit);
  };

  const handleKeyDown = (index, event) => {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < length - 1
    ) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange(pastedValue);

    const finalIndex = Math.min(
      pastedValue.length,
      length - 1
    );

    inputsRef.current[finalIndex]?.focus();
  };

  return (
    <div
      className="otp-input"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={
            index === 0
              ? "one-time-code"
              : "off"
          }
          maxLength={1}
          value={digit}
          onChange={(event) =>
            handleChange(index, event)
          }
          onKeyDown={(event) =>
            handleKeyDown(index, event)
          }
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;