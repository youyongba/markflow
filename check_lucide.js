const lucide = require('lucide-react');
const exportsList = Object.keys(lucide);
const needed = [
  'Github', 'Mail', 'Lock', 'Eye', 'EyeOff', 'ShieldCheck', 'Cpu', 'GitBranch', 'Zap', 'Fingerprint', 'ArrowRight', 'Terminal', 'FileCode'
];
for (const icon of needed) {
  if (!exportsList.includes(icon)) {
    console.log(icon, "is missing!");
  }
}