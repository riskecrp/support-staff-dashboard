import { NextApiRequest, NextApiResponse } from 'next';
import { addStrike, getStaffStrikes } from '@/lib/strikes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'Invalid staff ID' });
  }
  
  if (req.method === 'GET') {
    return handleGet(id, req, res);
  } else if (req.method === 'POST') {
    return handlePost(id, req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGet(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const strikes = await getStaffStrikes(parseInt(id));
    
    return res.status(200).json({
      success: true,
      data: strikes
    });
  } catch (error: any) {
    console.error('Error fetching strikes:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handlePost(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { reason, issued_by = 'ADMIN' } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }
    
    const result = await addStrike(parseInt(id), reason.trim(), issued_by);
    
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error adding strike:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
