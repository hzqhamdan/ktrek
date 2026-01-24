<?php
echo "PHP is working. Server time: " . date('Y-m-d H:i:s');
// Check if we can include a file without crashing
$file = '../config/constants.php';
if (file_exists($file)) {
    echo "<br>Found constants.php";
    try {
        include_once $file;
        echo "<br>Included constants.php successfully";
    } catch (Throwable $t) {
        echo "<br>Error including constants.php: " . $t->getMessage();
    }
} else {
    echo "<br>Could not find constants.php";
}
?>
