package com.example.image_moderation.services;

import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;

@Service
public class ImageModerationService {

    public boolean isImageSafeFromMultipartFile(MultipartFile file) {
        try (ImageAnnotatorClient vision = ImageAnnotatorClient.create()) {
            ByteString imgBytes = ByteString.readFrom(file.getInputStream());

            Image image = Image.newBuilder().setContent(imgBytes).build();
            Feature feature = Feature.newBuilder()
                    .setType(Feature.Type.SAFE_SEARCH_DETECTION)
                    .build();

            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feature)
                    .setImage(image)
                    .build();

            BatchAnnotateImagesResponse response = vision.batchAnnotateImages(Collections.singletonList(request));
            SafeSearchAnnotation annotation = response.getResponses(0).getSafeSearchAnnotation();

            System.out.println("Adult: " + annotation.getAdult());
            System.out.println("Racy: " + annotation.getRacy());
            System.out.println("Violence: " + annotation.getViolence());

            return annotation.getAdult().getNumber() < Likelihood.LIKELY.getNumber()
                    && annotation.getViolence().getNumber() < Likelihood.LIKELY.getNumber();

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

}
