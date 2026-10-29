import { Router, type Request, type Response } from "express";

const profileRouter: Router = Router();

profileRouter.get("/view", (req: Request, res: Response) => {
  const user = req.user!;

  return res.status(200).json({
    status: "success",
    message: "Profile fetched successfully",
    data: {
      id: user.id,
      name: user.name,
      lastName: user.lastName ?? null,
      email: user.email,
      image: user.image ?? null,
      gender: user.gender ?? null,
      age: user.age ?? null,
      about: user.about ?? null,
      favSingers: user.favSingers ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export default profileRouter;
