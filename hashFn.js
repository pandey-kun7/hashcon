const POOL_SIZE = BigInt(Math.pow(2,256));

export function HashFunc(str, totalKeys = POOL_SIZE){
    const hash = crypto.createHash('sha-256').update(str).digest('hex');
    const hashedKey = BigInt('0x' + hash);
    const mod = hashedKey % BigInt(totalKeys);
    return mod;
}