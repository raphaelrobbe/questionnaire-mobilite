export function capturePosition(): Promise<{ latitude: number; longitude: number }> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('La position a été refusée. L’entretien peut continuer sans elle.'))
          return
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error('La position n’est pas arrivée à temps. Réessayez, ou continuez sans.'))
          return
        }
        reject(new Error('Position indisponible. L’entretien peut continuer sans elle.'))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    )
  })
}
