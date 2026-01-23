import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      className="text-gray-700"
      style={{
        background: "linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%)",
      }}
    >
      {" "}
      <div className="container-custom py-12">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {" "}
          {/* About */}{" "}
          <div className="col-span-1 md:col-span-2">
            {" "}
            <div className="flex items-center space-x-2 mb-4">
              {" "}
              <img 
                src="/images/logo.png" 
                alt="K-Trek" 
                className="h-16 w-auto"
              />
              </span>{" "}
            </div>{" "}
            <p className="text-gray-600 mb-4">
              {" "}
              Discover Kelantan 's rich cultural heritage through an interactive
              and gamified tourism experience.Explore attractions, complete
              missions, and unlock rewards as you learn about Malaysia 's
              cultural cradle.{" "}
            </p>{" "}
            <div className="flex space-x-4">
              {" "}
              <a
                href="#"
                className="transition-colors"
                style={{
                  color: "#5E35B1",
                }}
              >
                {" "}
                <Facebook size={20} />{" "}
              </a>{" "}
              <a
                href="#"
                className="transition-colors"
                style={{
                  color: "#5E35B1",
                }}
              >
                {" "}
                <Instagram size={20} />{" "}
              </a>{" "}
              <a
                href="#"
                className="transition-colors"
                style={{
                  color: "#5E35B1",
                }}
              >
                {" "}
                <Twitter size={20} />{" "}
              </a>{" "}
              <a
                href="#"
                className="transition-colors"
                style={{
                  color: "#5E35B1",
                }}
              >
                {" "}
                <Mail size={20} />{" "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
          {/* Quick Links */}{" "}
          <div>
            {" "}
            <h3 className="text-white font-semibold mb-4">
              {" "}
              Quick Links{" "}
            </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <Link
                  to="/"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Home{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/attractions"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Attractions{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/dashboard/progress"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  My Progress{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/dashboard/rewards"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Rewards{" "}
                </Link>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          {/* Support */}{" "}
          <div>
            {" "}
            <h3 className="text-white font-semibold mb-4"> Support </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <Link
                  to="/dashboard/reports"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Report Issue{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <a
                  href="#"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  FAQ{" "}
                </a>{" "}
              </li>{" "}
              <li>
                {" "}
                <a
                  href="#"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Privacy Policy{" "}
                </a>{" "}
              </li>{" "}
              <li>
                {" "}
                <a
                  href="#"
                  className="hover:text-[#120c07] transition-colors"
                >
                  {" "}
                  Terms of Service{" "}
                </a>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
        </div>{" "}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          {" "}
          <p>
            {" "}
            & copy;
            {currentYear} K-Trek. All rights reserved.{" "}
          </p>{" "}
          <p className="mt-2">
            {" "}
            Developed as part of Final Year Project - Bachelor of Information
            Technology{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  );
};
export default Footer;
