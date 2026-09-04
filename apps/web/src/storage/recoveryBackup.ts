export function recoveryBackupText(recovery: string, siteUrl: string): string {
  if (!/^prism1\.[a-f0-9]{64}\.[a-f0-9]{64}$/.test(recovery.trim())) throw new Error('Paste the complete PRISM recovery key before downloading it.')
  const site = new URL(siteUrl).origin
  return `PRISM — private library recovery key\n\n${recovery.trim()}\n\nOpen ${site}/sources in another browser.\nChoose Library storage → Connect existing library, then paste the key above.\nUse the same key in every browser. Do not create a new library to reconnect.\n\nKeep this file somewhere safe, such as your password manager or an encrypted backup.\nAnyone with this key can open your library. This text file is not encrypted.\nPRISM cannot replace a lost key. This key is not a backup of your PDFs.\nWait for Synced before switching devices.\n`
}

export function downloadRecoveryKey(recovery: string) {
  const url = URL.createObjectURL(new Blob([recoveryBackupText(recovery, window.location.origin)], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'PRISM-recovery-key.txt'
  document.body.append(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
