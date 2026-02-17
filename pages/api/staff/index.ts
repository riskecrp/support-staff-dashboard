import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { is_active, is_support, is_senior_support } = req.query;
    
    let sql = 'SELECT * FROM staff WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;
    
    if (is_active !== undefined) {
      paramCount++;
      sql += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    if (is_support !== undefined) {
      paramCount++;
      sql += ` AND is_support = $${paramCount}`;
      params.push(is_support === 'true');
    }
    
    if (is_senior_support !== undefined) {
      paramCount++;
      sql += ` AND is_senior_support = $${paramCount}`;
      params.push(is_senior_support === 'true');
    }
    
    sql += ' ORDER BY name ASC';
    
    const result = await query(sql, params);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, is_senior_support = false } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }
    
    // Insert new staff member
    const result = await query(
      `INSERT INTO staff (name, is_support, is_senior_support) 
       VALUES ($1, true, $2) 
       RETURNING *`,
      [name.trim(), is_senior_support]
    );
    
    const staff = result.rows[0];
    
    // Log to audit
    await query(
      `INSERT INTO audit_log (staff_id, action, details, new_value, performed_by) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        staff.id,
        'ADD_STAFF',
        `Added new staff member: ${name}`,
        `is_support: true, is_senior_support: ${is_senior_support}`,
        'ADMIN'
      ]
    );
    
    return res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
