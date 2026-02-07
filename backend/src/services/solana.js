const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');

let connection = null;
let mintAuthority = null;
let mintAddress = null;

/**
 * Initialize Solana connection and mint authority.
 * In production, SOLANA_MINT_KEYPAIR would be a persisted keypair.
 * For hackathon MVP, we generate fresh on first boot and store the mint.
 */
async function initSolana() {
  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
  connection = new Connection(rpcUrl, 'confirmed');
  
  // Generate mint authority (hackathon — ephemeral is fine)
  if (process.env.SOLANA_MINT_KEYPAIR) {
    const decoded = Buffer.from(process.env.SOLANA_MINT_KEYPAIR, 'base64');
    mintAuthority = Keypair.fromSecretKey(decoded);
  } else {
    mintAuthority = Keypair.generate();
    console.log('⚠️  Generated ephemeral mint authority:', mintAuthority.publicKey.toBase58());
  }
  
  // Airdrop some SOL for tx fees (devnet only)
  try {
    const sig = await connection.requestAirdrop(mintAuthority.publicKey, 2e9); // 2 SOL
    await connection.confirmTransaction(sig);
    console.log('💰 Airdropped 2 SOL to mint authority');
  } catch (err) {
    console.warn('⚠️  Airdrop failed (may already have balance):', err.message);
  }
  
  // Create the FOCUS token mint (0 decimals — whole tokens only)
  try {
    mintAddress = await createMint(
      connection,
      mintAuthority,     // payer
      mintAuthority.publicKey, // mint authority
      null,              // freeze authority
      0                  // decimals
    );
    console.log('🪙 FOCUS token mint created:', mintAddress.toBase58());
  } catch (err) {
    console.error('❌ Failed to create mint:', err.message);
  }
  
  return { connection, mintAuthority, mintAddress };
}

/**
 * Reward FOCUS tokens to a user's wallet.
 * @param {string} walletPubkey - User's Solana wallet public key
 * @param {number} amount - Number of FOCUS tokens to mint
 * @returns {string|null} Transaction signature or null on failure
 */
async function rewardTokens(walletPubkey, amount) {
  if (!connection || !mintAddress || !mintAuthority) {
    console.warn('Solana not initialized, skipping reward');
    return null;
  }
  
  try {
    const userPubkey = new PublicKey(walletPubkey);
    
    // Get or create the user's token account for FOCUS
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,    // payer
      mintAddress,      // mint
      userPubkey        // owner
    );
    
    // Mint tokens
    const sig = await mintTo(
      connection,
      mintAuthority,     // payer
      mintAddress,       // mint
      tokenAccount.address, // destination
      mintAuthority,     // authority
      amount             // amount (0 decimals, so 1 = 1 token)
    );
    
    console.log(`🪙 Minted ${amount} FOCUS to ${walletPubkey}: ${sig}`);
    return sig;
  } catch (err) {
    console.error('❌ Token reward failed:', err.message);
    return null;
  }
}

/**
 * Calculate token reward based on session performance.
 * Graceful — rewards effort, not just perfection.
 */
function calculateReward(avgFocusScore, durationMinutes, streak) {
  // Base: 1 token per 5 min of focused work (score > 50)
  let base = avgFocusScore > 50 ? Math.floor(durationMinutes / 5) : 0;
  
  // Bonus for high focus
  if (avgFocusScore >= 80) base = Math.ceil(base * 1.5);
  
  // Streak multiplier (caps at 3x)
  const streakMultiplier = Math.min(1 + (streak * 0.1), 3);
  
  return Math.max(1, Math.floor(base * streakMultiplier)); // minimum 1 token for completing
}

function getMintAddress() {
  return mintAddress?.toBase58() || null;
}

module.exports = { initSolana, rewardTokens, calculateReward, getMintAddress };
