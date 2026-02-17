import { NextApiRequest, NextApiResponse } from 'next';
import { removeStrike } from '@/lib/strikes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'Invalid strike ID' });
  }
  
  if (req.method === 'DELETE') {
    return handleDelete(id, req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { removed_by = 'ADMIN' } = req.body;
    
    await removeStrike(parseInt(id), removed_by);
    
    return res.status(200).json({
      success: true,
      message: 'Strike removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing strike:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
