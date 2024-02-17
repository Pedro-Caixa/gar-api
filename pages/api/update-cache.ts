import type { NextApiRequest, NextApiResponse } from 'next';
import { updateCache } from "../../functions/get-blacklists"


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
)
{
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
      }
      try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Token not found.' });
          }
          const secretKey = process.env.SECRET_KEY_ACESS
        if (token == secretKey){
            updateCache();
            res.status(200).json({ message: 'Cache updated successfully!' });
        }  else {
            res.status(401).json({ error: 'Unauthorized' });

        }        

      } catch (error) {
        res.status(500).json({ error: 'Error processing request.' });
      }
} 