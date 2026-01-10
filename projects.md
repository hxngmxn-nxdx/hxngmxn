---
layout: default
title: Projects
permalink: /projects/
---

<div class="layout">
  {% include sidebar.html %}
  <main class="content">
    <div class="section-title">Projects</div>
    {% assign grouped_projects = site.posts | where_exp: "post", "post.project" | group_by: "project" %}
    {% for project in grouped_projects %}
      <div class="project-group">
        <div class="project-title">{{ project.name }}</div>
        <ul class="post-list">
          {% for post in project.items %}
            <li class="post-item">
              <div class="post-row">
                <span class="post-date">[{{ post.date | date: "%Y-%m-%d" }}]</span>
                <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
              </div>
              <div class="post-separator" aria-hidden="true"></div>
            </li>
          {% endfor %}
        </ul>
      </div>
    {% endfor %}
  </main>
</div>
