import Vault from "./lib/Vault";

const vault = new Vault(1_000_000_000, 0.1, 0.1);

console.log('-----------');
vault.print();
console.log('-----------');
console.log(vault.value);