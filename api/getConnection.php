<?php
 
function getConnection() {
    require "credentials.php";
   
    try {
        $connection = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
 
        return $connection;
 
    } catch( PDOException $e ) {
        echo "Database Connection Error: ";
        echo $e->getMessage();
        
        exit();
    }
}
