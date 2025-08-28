// components/ListingCarousel.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface ListingCarouselProps {
  images: string[];
  title: string;
}

export default function ListingCarousel({ images, title }: ListingCarouselProps) {
  return (
    <Swiper pagination={{ clickable: true }} modules={[Pagination]} className="w-full aspect-square">
      {(images.length ? images : ["https://via.placeholder.com/400x300"]).map((img, index) => (
        <SwiperSlide key={index}>
          <img src={img} alt={`${title} image ${index + 1}`} className="w-full h-full object-cover" />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
