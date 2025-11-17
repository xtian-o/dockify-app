"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  MdCode,
  MdDataObject,
  MdDownload,
  MdSearch,
  MdStorage,
  MdWeb,
} from "react-icons/md";
import {
  SiDocker,
  SiMongodb,
  SiNextdotjs,
  SiPostgresql,
  SiRedis,
} from "react-icons/si";
import { cn } from "@/lib/utils";

// Sample apps data - replace with real data from API
const apps = [
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Advanced open source relational database",
    icon: SiPostgresql,
    category: "Database",
    color: "bg-blue-500/80",
    installs: "2.3k",
  },
  {
    id: "redis",
    name: "Redis",
    description: "In-memory data structure store",
    icon: SiRedis,
    category: "Database",
    color: "bg-red-500/80",
    installs: "1.8k",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "NoSQL document database",
    icon: SiMongodb,
    category: "Database",
    color: "bg-green-500/80",
    installs: "1.5k",
  },
  {
    id: "nextjs",
    name: "Next.js",
    description: "React framework for production",
    icon: SiNextdotjs,
    category: "Framework",
    color: "bg-gray-800/80",
    installs: "3.1k",
  },
  {
    id: "docker",
    name: "Docker Registry",
    description: "Private Docker registry",
    icon: SiDocker,
    category: "Tools",
    color: "bg-blue-600/80",
    installs: "892",
  },
];

const categories = [
  { id: "all", name: "All Apps", icon: MdWeb },
  { id: "database", name: "Database", icon: MdStorage },
  { id: "framework", name: "Framework", icon: MdCode },
  { id: "tools", name: "Tools", icon: MdDataObject },
];

function AppCard({ app }: { app: (typeof apps)[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = app.icon;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex overflow-hidden rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm transition-colors isolate group">
        {/* Background Overlay on Hover */}
        <motion.div
          className="absolute inset-0 bg-primary/5"
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Icon Container - Left Side */}
        <div className="relative z-10 flex items-center justify-center w-20 shrink-0 bg-primary/5 border-r border-primary/80">
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-md border border-primary/80",
              app.color,
            )}
          >
            <motion.div
              variants={{
                rest: { rotate: 0, scale: 1 },
                hover: { rotate: 12, scale: 1.1 },
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Content - Right Side */}
        <div className="relative z-10 p-3 flex-1 flex flex-col justify-between">
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-semibold text-primary/80">
                {app.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary/80 border border-primary/20">
                {app.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {app.description}
            </p>
          </div>

          {/* Bottom Row: Stats + Deploy Button */}
          <div className="flex items-center justify-between mt-3">
            {/* Stats */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MdDownload className="h-3 w-3" />
              <span>{app.installs} deploys</span>
            </div>

            {/* Deploy Button */}
            <motion.button
              className="relative flex h-7 items-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate px-3 text-xs font-medium text-primary/80"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.05 },
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-primary/5"
                variants={{
                  rest: { opacity: 0 },
                  hover: { opacity: 1 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <span className="relative z-10">Deploy</span>
            </motion.button>
          </div>
        </div>

        {/* Shimmer Effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-50 transition-all duration-500 ease-out bg-gradient-to-r from-transparent via-primary/20 to-transparent",
            isHovered
              ? "translate-x-full opacity-100"
              : "-translate-x-full opacity-0",
          )}
        />
      </div>
    </motion.div>
  );
}

function CategoryButton({
  category,
  isActive,
  onClick,
}: {
  category: (typeof categories)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.icon;

  return (
    <motion.div initial="rest" whileHover="hover" animate="rest">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex h-8 items-center overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate group px-3 border-r-[3px]",
          isActive && "bg-primary/10",
        )}
      >
        {/* Background Overlay on Hover */}
        <motion.div
          className="absolute inset-0 bg-primary/5"
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Icon */}
        <span className="relative z-10 mr-2">
          <motion.div
            variants={{
              rest: { rotate: 0, scale: 1 },
              hover: { rotate: 12, scale: 1.1 },
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Icon className="h-4 w-4 text-primary/80" />
          </motion.div>
        </span>

        {/* Label */}
        <span className="relative z-10 text-xs font-medium text-primary/80">
          {category.name}
        </span>

        {/* Shimmer Effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-50 transition-all duration-500 ease-out bg-gradient-to-r from-transparent via-primary/20 to-transparent",
            isHovered
              ? "translate-x-full opacity-100"
              : "-translate-x-full opacity-0",
          )}
        />
      </button>
    </motion.div>
  );
}

export default function AppCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = apps.filter((app) => {
    const matchesCategory =
      selectedCategory === "all" ||
      app.category.toLowerCase() === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary/80">
            App Catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse and deploy applications to your infrastructure
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex h-9 items-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm">
            <span className="flex h-full w-9 shrink-0 items-center justify-center bg-primary/80">
              <MdSearch className="h-4 w-4 text-white dark:text-black" />
            </span>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 text-xs text-primary/80 placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Apps List */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-primary/80 shadow-sm p-12">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-xl font-bold tracking-tight text-primary/80">
              No applications found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
