import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Rating } from "./ui/rating";
import { Review, User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";

// Component to display a review
export function ReviewCard({ review, userName }: { review: Review; userName: string }) {
  const { t } = useTranslation();
  const formattedDate = review.createdAt 
    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
    : '';

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
              <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-md">{userName}</CardTitle>
              <div className="flex items-center gap-2">
                <Rating value={review.rating} />
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription>{review.comment}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Component to add a new review
export function ReviewForm({ serviceId, onReviewSubmitted }: { serviceId: number; onReviewSubmitted?: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { serviceId: number; rating: number; comment: string }) => {
      return apiRequest("/api/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      toast({
        title: t("Review submitted"),
        description: t("Your review has been successfully submitted"),
        variant: "default",
      });
      // Reset form
      setRating(0);
      setComment("");
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/rating`] });
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("Error"),
        description: error.message || t("Failed to submit review"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: t("Authentication required"),
        description: t("Please log in to submit a review"),
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: t("Rating required"),
        description: t("Please select a rating before submitting"),
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      serviceId,
      rating,
      comment: comment || null,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("Leave a Review")}</CardTitle>
        <CardDescription>{t("Share your experience with this service")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("Rating")}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl focus:outline-none ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t("Comment")}</label>
            <Textarea
              placeholder={t("Write your review here...")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={reviewMutation.isPending}
        >
          {reviewMutation.isPending ? t("Submitting...") : t("Submit Review")}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Component to display all reviews for a service
export function ServiceReviews({ serviceId }: { serviceId: number }) {
  const { t } = useTranslation();
  
  // Fetch reviews
  const {
    data: reviews = [],
    isLoading: isLoadingReviews,
    error: reviewsError,
  } = useQuery<Review[]>({
    queryKey: [`/api/services/${serviceId}/reviews`],
    enabled: !!serviceId,
  });

  // Fetch average rating
  const {
    data: ratingData = { rating: 0 },
    isLoading: isLoadingRating,
  } = useQuery<{ rating: number }>({
    queryKey: [`/api/services/${serviceId}/rating`],
    enabled: !!serviceId,
  });

  // Fetch users to display names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!reviews && reviews.length > 0,
  });

  const getUserName = (userId: number): string => {
    if (!users.length) return `User ${userId}`;
    const user = users.find((u) => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  if (isLoadingReviews || isLoadingRating) {
    return <div className="py-4">{t("Loading reviews...")}</div>;
  }

  if (reviewsError) {
    return <div className="py-4 text-red-500">{t("Error loading reviews")}</div>;
  }

  const averageRating = ratingData.rating || 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">{t("Reviews")}</h3>
        <div className="flex items-center gap-2 mb-4">
          <Rating value={Math.round(averageRating)} />
          <span className="text-sm text-gray-600">
            {averageRating.toFixed(1)} {t("out of 5")} ({reviews.length || 0} {t("reviews")})
          </span>
        </div>
        
        <ReviewForm 
          serviceId={serviceId} 
          onReviewSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/reviews`] });
            queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/rating`] });
          }}
        />
        
        {reviews.length > 0 ? (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                userName={getUserName(review.userId)}
              />
            ))}
          </div>
        ) : (
          <div className="py-4 text-gray-500">{t("No reviews yet. Be the first to leave a review!")}</div>
        )}
      </div>
    </div>
  );
}