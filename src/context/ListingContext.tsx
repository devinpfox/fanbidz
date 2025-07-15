"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Listing = {
  id: number;
  title: string;
  description: string;
  image: string;
  likes: number;
  comments: number;
  date: string;
  lastBid: number;
  buyNow: number;
  secondsLeft?: number;
  isCharity: boolean;
  user: {
    name: string;
    category: string;
    avatar: string;
    
  };
};

type ListingContextType = {
  listings: Listing[];
  addListing: (listing: Listing) => void;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<Listing[]>([]);

  const addListing = (listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
  };

  return (
    <ListingContext.Provider value={{ listings, addListing }}>
      {children}
    </ListingContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error("useListings must be used inside ListingProvider");
  return context;
};
