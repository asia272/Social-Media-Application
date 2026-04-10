"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useUser } from "@clerk/nextjs";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ImageIcon, Loader2, Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "@/app/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";


const CreatePost = () => {
    const { user } = useUser();//get user
    const [content, setContent] = useState("");
    const [image, setImage] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);




    //server action
    const handleSubmit = async () => {


        if (!content.trim() && !image) return;
        console.log("My post image is here:", image)


        setIsPosting(true);
        try {
            const result = await createPost(content, image)

            if (result.success) {
                setContent("")
                setImage("")
                setShowImageUpload(false)
                toast.success("Post create successfully")
            }

        } catch (error) {
            toast.error("Faild to create post")
        } finally {
            setIsPosting(false);
        }
    }
    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                        </Avatar>
                        <Textarea
                            placeholder="What's on your mind?"
                            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isPosting}
                        />
                    </div>
                </div>

                {/* image upload */}
                {(showImageUpload || image) && (
                    <div className="border rounded-lg p-4">
                        <ImageUpload
                            value={image}
                            onChange={setImage}
                        />
                    </div>
                )}
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setShowImageUpload(!showImageUpload)}
                            disabled={isPosting}
                        >
                            <ImageIcon className="size-4 mr-2" />
                            Photo
                        </Button>
                    </div>
                    <Button
                        className="flex items-center"
                        onClick={handleSubmit}
                        disabled={(!content.trim() && !image) || isPosting}
                    >
                        {isPosting ? (
                            <>
                                <Loader2Icon className="size-4 mr-2 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <SendIcon className="size-4 mr-2" />
                                Post
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default CreatePost