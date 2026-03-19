import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { ForumThread } from '../models/forum/ForumThread';
import { ForumPost } from '../models/forum/ForumPost';

export class ForumController {
    public static async getThreads(req: Request, res: Response): Promise<void> {
        try {
            const threads = await ApplicationDbContext.getRepository(ForumThread).find({
                relations: ["author", "posts"],
                order: { createdAt: "DESC" }
            });

            // Lược bỏ thông tin nhạy cảm của author trước khi trả về
            const result = threads.map(t => ({
                id: t.id,
                title: t.title,
                content: t.content,
                createdAt: t.createdAt,
                viewCount: t.viewCount,
                authorName: t.author?.username,
                postCount: t.posts.length
            }));

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
        }
    }

    public static async getThreadDetails(req: Request, res: Response): Promise<void> {
        const threadId = parseInt(req.params.id as string);

        try {
            const threadRepo = ApplicationDbContext.getRepository(ForumThread);
            const thread = await threadRepo.findOne({
                where: { id: threadId },
                relations: ["author", "posts", "posts.author"],
                order: { posts: { createdAt: "ASC" } }
            });

            if (!thread) {
                res.status(404).json({ error: "Không tìm thấy bài viết" });
                return;
            }

            thread.viewCount++;
            await threadRepo.save(thread);

            res.status(200).json({
                id: thread.id,
                title: thread.title,
                content: thread.content,
                createdAt: thread.createdAt,
                viewCount: thread.viewCount,
                authorName: thread.author?.username,
                posts: thread.posts.map(p => ({
                    id: p.id,
                    content: p.content,
                    createdAt: p.createdAt,
                    authorName: p.author?.username
                }))
            });
        } catch (error) {
            res.status(500).json({ error: "Lỗi server" });
        }
    }

    public static async createThread(req: Request, res: Response): Promise<void> {
        const { title, content } = req.body;
        const authorId = (req as any).user.accountId;

        if (!title || !content) {
            res.status(400).json({ error: "Tiêu đề và nội dung không được để trống" });
            return;
        }

        try {
            const thread = new ForumThread();
            thread.title = title;
            thread.content = content;
            thread.authorId = authorId;
            thread.createdAt = new Date();

            await ApplicationDbContext.getRepository(ForumThread).save(thread);
            res.status(201).json({ message: "Tạo bài viết thành công", threadId: thread.id });
        } catch (error) {
            res.status(500).json({ error: "Lỗi server" });
        }
    }

    public static async reply(req: Request, res: Response): Promise<void> {
        const { threadId, content } = req.body;
        const authorId = (req as any).user.accountId;

        if (!content) {
            res.status(400).json({ error: "Nội dung không được để trống" });
            return;
        }

        try {
            const post = new ForumPost();
            post.threadId = parseInt(threadId);
            post.content = content;
            post.authorId = authorId;
            post.createdAt = new Date();

            await ApplicationDbContext.getRepository(ForumPost).save(post);
            res.status(201).json({ message: "Bình luận thành công" });
        } catch (error) {
            res.status(500).json({ error: "Lỗi server" });
        }
    }
}