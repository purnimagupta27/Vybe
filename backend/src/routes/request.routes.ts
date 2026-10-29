import {Router, type Request, type Response} from "express"

const requestRouter: Router = Router();

requestRouter.post("/sendConnectionRequest", async(req: Request, res: Response) => {
    //Sending connection request
    console.log("Sending a connection request")
})

export default requestRouter