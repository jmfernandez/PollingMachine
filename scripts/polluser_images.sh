#!/bin/bash

if [ $# -gt 0 ] ; then
	d="$1"

	if [ -d "$d" ] ; then
		for polluser_image in "$d"/*.[jp][np]g ; do
			case "$polluser_image" in
				*.jpg)
					polluser_id="$(basename "$polluser_image" .jpg)"
					photo_mime='image/jpeg'
					;;
				*.png)
					polluser_id="$(basename "$polluser_image" .png)"
					photo_mime='image/png'
					;;
				*)
					continue
					;;
			esac
			echo "UPDATE POLLUSER SET photo=x'$(hexdump -v -e '1/1 "%02x"' "$polluser_image")', photo_mime='$photo_mime' WHERE id_mail='${polluser_id}@cnio.es';"
			echo
		done
	fi
else
	echo "ERROR: This script needs as input a directory with the voters' photos" 1>&2
	exit 1
fi
