import { RequestHandler } from '../../types/express.types';

export const testErrorHandling: RequestHandler = (req, res) => {
  const testCase = req.query.case as string;
  
  switch(testCase) {
    case 'standard':
      throw new Error('Standard error');
    case 'custom-status':
      const err = new Error('Custom status error');
      (err as any).status = 400;
      throw err;
    case 'exposed':
      const exposedErr = new Error('Exposed error');
      (exposedErr as any).expose = true;
      throw exposedErr;
    case 'non-error':
      throw { message: 'Non-error object' };
    default:
      res.json({ message: 'No error case specified' });
  }
};
