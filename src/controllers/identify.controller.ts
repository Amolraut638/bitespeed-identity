import { Request, Response } from "express";
import { identifyService } from "../services/identify.service";

export const identifyHandler = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        message: "At least one of email or phoneNumber is required"
      });
    }

    const result = await identifyService(email, phoneNumber);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};