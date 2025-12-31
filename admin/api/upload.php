<?php
// api/upload.php

header('Content-Type: application/json'); // Ensure response is always JSON

// Function to validate and upload a file
function uploadFile($fileInputName) {
    $base_url = "http://localhost";
    $targetDir = "../uploads/";
    $targetFile = $targetDir . basename($_FILES[$fileInputName]["name"]);
    $uploadOk = 1;
    $imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

    // Check if image file is a actual image or fake image
    if(isset($_POST["submit"])) {
        $check = getimagesize($_FILES[$fileInputName]["tmp_name"]);
        if($check === false) {
            return array("success" => false, "message" => "File is not an image.");
        }
    }

    // Check if file already exists
    if (file_exists($targetFile)) {
        // Generate a unique filename
        $filename = pathinfo($targetFile, PATHINFO_FILENAME);
        $extension = pathinfo($targetFile, PATHINFO_EXTENSION);
        $counter = 1;
        do {
            $newFilename = $filename . "_" . $counter . "." . $extension;
            $targetFile = $targetDir . $newFilename;
            $counter++;
        } while (file_exists($targetFile));
    }

    // Check file size (in bytes). Default: 10 MB
    $maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if ($_FILES[$fileInputName]["size"] > $maxSizeBytes) {
        $maxMb = round($maxSizeBytes / (1024 * 1024));
        return array("success" => false, "message" => "Sorry, your file is too large. Max allowed is {$maxMb}MB.");
    }

    // Allow certain file formats
    $allowedTypes = array("jpg", "jpeg", "png", "gif", "webp");
    if (!in_array($imageFileType, $allowedTypes)) {
        return array("success" => false, "message" => "Sorry, only JPG, JPEG, PNG, GIF & WEBP files are allowed.");
    }

    // Check if $uploadOk is set to 0 by an error
    if ($uploadOk == 0) {
        return array("success" => false, "message" => "Sorry, your file was not uploaded.");
    } else {
        if (move_uploaded_file($_FILES[$fileInputName]["tmp_name"], $targetFile)) {
            // Return the relative path for the frontend to use
            $relativePath = "uploads/" . basename($targetFile);
            $image_url = $base_url . "/admin/" . $relativePath;
            return array("success" => true, "filePath" => $relativePath, "imageUrl" => $image_url);
        } else {
            return array("success" => false, "message" => "Sorry, there was an error uploading your file.");
        }
    }
}

// Main logic
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if a file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            'success' => false,
            'message' => 'No file uploaded or upload error.'
        ]);
        exit();
    }

    // Validate and upload the file
    $result = uploadFile('file');

    // Always return JSON
    echo json_encode($result);
} else {
    // Handle other HTTP methods if needed
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method. Use POST.'
    ]);
}
?>