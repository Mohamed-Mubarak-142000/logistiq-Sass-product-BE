import { Router, Response } from 'express';
import { upload } from '../config/cloudinary';
import { auth } from '../middlewares/auth';
import { AuthRequest } from '../middlewares/auth';

const router = Router();

router.post('/', auth, upload.single('image'), (req: AuthRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
        success: true,
        data: {
            url: req.file.path,
            publicId: (req.file as any).filename,
        },
    });
});

export default router;
