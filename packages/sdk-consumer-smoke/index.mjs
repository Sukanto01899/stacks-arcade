(async () => {
  const { createArcadeClient, makeSecretHex } = await import('@stacks-arcade/sdk');
  const arcade = createArcadeClient({ network: 'testnet', deployer: 'ST123' });
  console.log(makeSecretHex().length);
  console.log(arcade.contracts.coinFlip.name);
})();
