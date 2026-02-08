const passwords = [
  ' ',           // literal space
  '%20',         // URL-encoded space
  '',            // empty
  'space',       // literal word
  '+',           // alternative space encoding
  '%2520',       // double-encoded space
];

passwords.forEach((pass, i) => {
  const encoded = encodeURIComponent(pass);
  console.log(`${i+1}. "${pass}" → encoded: "${encoded}"`);
  const uri = `mongodb+srv://faze:${encoded}@cluster0.zhmrrvr.mongodb.net/focusflow?retryWrites=true&w=majority`;
  console.log(`   URI: ${uri}\n`);
});
