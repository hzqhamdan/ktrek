import React from "react";
import { NotFoundPage as NotFoundPageComponent } from "../components/ui/not-found-page";

const NotFoundPage = () => {
  return (
    <NotFoundPageComponent
      title="Oops! You've Gone Off the Map"
      description="The page you're looking for doesn't exist or has been moved. Let's get you back on track!"
      showBackButton={true}
      showHomeButton={true}
    />
  );
};

export default NotFoundPage;
