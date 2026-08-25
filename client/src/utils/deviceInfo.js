function detectBrowser(userAgent) {
  if (userAgent.includes("Edg/")) {
    return "Microsoft Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Google Chrome";
  }

  if (userAgent.includes("Firefox/")) {
    return "Mozilla Firefox";
  }

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  return "Unknown browser";
}

function detectOperatingSystem(userAgent) {
  if (userAgent.includes("Windows NT 10.0")) {
    return "Windows";
  }

  if (userAgent.includes("Android")) {
    return "Android";
  }

  if (
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
  ) {
    return "iOS";
  }

  if (userAgent.includes("Mac OS X")) {
    return "macOS";
  }

  if (userAgent.includes("Linux")) {
    return "Linux";
  }

  return "Unknown operating system";
}

function detectDeviceName(userAgent) {
  if (
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    return "Mobile device";
  }

  if (userAgent.includes("iPad")) {
    return "Tablet";
  }

  return "Desktop browser";
}

export function getDeviceInformation() {
  const userAgent = navigator.userAgent || "";

  return {
    deviceName: detectDeviceName(userAgent),
    browser: detectBrowser(userAgent),
    operatingSystem:
      detectOperatingSystem(userAgent)
  };
}